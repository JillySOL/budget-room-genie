/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const FREE_GENERATION_LIMIT = 2;

// ── Stripe client (cached) ───────────────────────────────────────────────────

let stripeClient: InstanceType<typeof Stripe> | null = null;

export async function getStripe(): Promise<InstanceType<typeof Stripe>> {
    if (stripeClient) return stripeClient;
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY environment variable not set");
    stripeClient = new Stripe(key, { apiVersion: "2026-03-25.dahlia" as any });
    return stripeClient;
}

function getStripeWebhookSecret(): string {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET environment variable not set");
    return secret;
}

// ── Checkout & Portal ────────────────────────────────────────────────────────

export async function getOrCreateStripeCustomer(
    userId: string,
    email: string
): Promise<string> {
    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(userId).get();
    const existingCustomerId = userDoc.data()?.stripeCustomerId as string | undefined;

    if (existingCustomerId) return existingCustomerId;

    const stripe = await getStripe();
    const customer = await stripe.customers.create({
        email,
        metadata: { firebaseUID: userId },
    });

    await db.collection("users").doc(userId).set(
        { stripeCustomerId: customer.id },
        { merge: true }
    );

    return customer.id;
}

export async function createCheckoutSession(params: {
    userId: string;
    email: string;
    planId: "monthly" | "annual";
    successUrl: string;
    cancelUrl: string;
    fbp?: string;
    fbc?: string;
}): Promise<string> {
    const { userId, email, planId, successUrl, cancelUrl, fbp, fbc } = params;
    const stripe = await getStripe();

    const monthlyPriceId = process.env.STRIPE_MONTHLY_PRICE_ID;
    const annualPriceId = process.env.STRIPE_ANNUAL_PRICE_ID;
    if (!monthlyPriceId || !annualPriceId) {
        throw new Error("Stripe price IDs not configured. Set STRIPE_MONTHLY_PRICE_ID and STRIPE_ANNUAL_PRICE_ID in environment.");
    }

    const priceId = planId === "annual" ? annualPriceId : monthlyPriceId;
    const customerId = await getOrCreateStripeCustomer(userId, email);

    const sessionParams: any = {
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        metadata: {
            firebaseUID: userId,
            planId,
            fbp: fbp || "",
            fbc: fbc || "",
        },
        subscription_data: {
            metadata: {
                firebaseUID: userId,
                planId,
                fbp: fbp || "",
                fbc: fbc || "",
            },
        },
    };

    // 7-day free trial on annual plan — no card required upfront
    if (planId === "annual") {
        sessionParams.subscription_data.trial_period_days = 7;
        sessionParams.subscription_data.trial_settings = {
            end_behavior: { missing_payment_method: "cancel" },
        };
        sessionParams.payment_method_collection = "if_required";
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return session.url;
}

export async function createPortalSession(params: {
    userId: string;
    returnUrl: string;
}): Promise<string> {
    const { userId, returnUrl } = params;
    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(userId).get();
    const customerId = userDoc.data()?.stripeCustomerId as string | undefined;

    if (!customerId) throw new Error("No Stripe customer found for this user. Please contact support.");

    const stripe = await getStripe();
    const session = await (stripe.billingPortal.sessions as any).create({
        customer: customerId,
        return_url: returnUrl,
    });
    return session.url;
}

// ── Webhook processing ────────────────────────────────────────────────────────

export async function verifyAndParseWebhook(
    rawBody: Buffer,
    signature: string
): Promise<any> {
    const webhookSecret = getStripeWebhookSecret();
    const stripe = await getStripe();
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

async function syncSubscriptionToFirestore(subscription: any): Promise<void> {
    const db = admin.firestore();
    const userId = subscription.metadata?.firebaseUID as string | undefined;
    if (!userId) {
        logger.warn("Stripe subscription missing firebaseUID metadata", { id: subscription.id });
        return;
    }

    const status = subscription.status as string;
    const planId = (subscription.metadata?.planId as "monthly" | "annual") || "monthly";
    const isPro = ["active", "trialing"].includes(status);

    await db.collection("users").doc(userId).set(
        {
            subscription: {
                stripeSubscriptionId: subscription.id,
                status,
                planId,
                currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
                    subscription.current_period_end * 1000
                ),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                trialEnd: subscription.trial_end
                    ? admin.firestore.Timestamp.fromMillis(subscription.trial_end * 1000)
                    : null,
            },
        },
        { merge: true }
    );

    // Firebase Auth custom claim for fast client-side checks
    await admin.auth().setCustomUserClaims(userId, {
        stripeRole: isPro ? "pro" : null,
    });

    logger.info(`Synced subscription for user ${userId}: ${status} (${planId})`);
}

export async function handleWebhookEvent(event: any): Promise<void> {
    const db = admin.firestore();

    switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
            await syncSubscriptionToFirestore(event.data.object);
            break;

        case "customer.subscription.deleted": {
            const sub = event.data.object;
            const userId = sub.metadata?.firebaseUID as string | undefined;
            if (userId) {
                await db.collection("users").doc(userId).set(
                    { subscription: { status: "canceled" } },
                    { merge: true }
                );
                await admin.auth().setCustomUserClaims(userId, { stripeRole: null });
                logger.info(`Subscription canceled for user ${userId}`);
            }
            break;
        }

        case "checkout.session.completed":
            logger.info(`Checkout completed: ${event.data.object.id}`);
            break;

        case "invoice.payment_succeeded":
            logger.info(`Payment succeeded: ${event.data.object.id}`);
            break;

        case "invoice.payment_failed":
            logger.warn(`Payment failed: ${event.data.object.id}`);
            break;

        default:
            logger.info(`Unhandled Stripe event: ${event.type}`);
    }
}

// ── Usage gating ─────────────────────────────────────────────────────────────

export async function checkCanGenerate(userId: string): Promise<{
    canGenerate: boolean;
    generationsUsed: number;
    generationsLimit: number;
    isPro: boolean;
}> {
    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data() || {};

    const subStatus = userData.subscription?.status as string | undefined;
    const isPro = ["active", "trialing"].includes(subStatus || "");
    const generationsUsed = (userData.generationsUsed as number) || 0;

    return {
        canGenerate: isPro || generationsUsed < FREE_GENERATION_LIMIT,
        generationsUsed,
        generationsLimit: FREE_GENERATION_LIMIT,
        isPro,
    };
}

export async function incrementGenerationCount(userId: string): Promise<void> {
    const db = admin.firestore();
    await db.collection("users").doc(userId).set(
        { generationsUsed: FieldValue.increment(1) },
        { merge: true }
    );
}

export { FREE_GENERATION_LIMIT };
