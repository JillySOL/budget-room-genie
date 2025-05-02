import * as admin from "firebase-admin";
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.debug(`[DEBUG] ${message}`, ...args)
};

export enum SubscriptionPlanType {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium'
}

export interface SubscriptionPlan {
  id: SubscriptionPlanType;
  name: string;
  price: number;
  description: string;
  features: string[];
  generationsPerMonth: number;
  enhancedDescriptions: boolean;
  projectsLimit: number;
}

export interface UserSubscription {
  userId: string;
  planId: SubscriptionPlanType;
  status: 'active' | 'canceled' | 'expired';
  startDate: admin.firestore.Timestamp;
  endDate: admin.firestore.Timestamp;
  generationsUsed: number;
  lastRenewal: admin.firestore.Timestamp;
  paymentMethod?: string;
  autoRenew: boolean;
}

export const subscriptionPlans: Record<SubscriptionPlanType, SubscriptionPlan> = {
  [SubscriptionPlanType.FREE]: {
    id: SubscriptionPlanType.FREE,
    name: 'Free',
    price: 0,
    description: 'Try out Budget Room Genie with one free room design',
    features: [
      '1 room design per month',
      'Basic DIY suggestions',
      'Limited project storage'
    ],
    generationsPerMonth: 1,
    enhancedDescriptions: false,
    projectsLimit: 3
  },
  [SubscriptionPlanType.BASIC]: {
    id: SubscriptionPlanType.BASIC,
    name: 'Basic',
    price: 9.99,
    description: 'Perfect for occasional home improvers',
    features: [
      '5 room designs per month',
      'Enhanced DIY suggestions',
      'Unlimited project storage',
      'Project sharing'
    ],
    generationsPerMonth: 5,
    enhancedDescriptions: true,
    projectsLimit: 20
  },
  [SubscriptionPlanType.PREMIUM]: {
    id: SubscriptionPlanType.PREMIUM,
    name: 'Premium',
    price: 19.99,
    description: 'For serious renovators and designers',
    features: [
      'Unlimited room designs',
      'Priority processing',
      'Enhanced DIY suggestions with cost estimates',
      'Unlimited project storage',
      'Project sharing and collaboration',
      'Premium support'
    ],
    generationsPerMonth: 999, // Effectively unlimited
    enhancedDescriptions: true,
    projectsLimit: 999 // Effectively unlimited
  }
};

export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const db = admin.firestore();
    const subscriptionDoc = await db.collection('subscriptions').doc(userId).get();
    
    if (!subscriptionDoc.exists) {
      const newSubscription = createFreeSubscription(userId);
      await db.collection('subscriptions').doc(userId).set(newSubscription);
      return newSubscription;
    }
    
    return subscriptionDoc.data() as UserSubscription;
  } catch (error) {
    logger.error(`Error getting subscription for user ${userId}:`, error);
    return null;
  }
}

export function createFreeSubscription(userId: string): UserSubscription {
  const now = admin.firestore.Timestamp.now();
  const endDate = admin.firestore.Timestamp.fromDate(
    new Date(now.toDate().setFullYear(now.toDate().getFullYear() + 1))
  );
  
  return {
    userId,
    planId: SubscriptionPlanType.FREE,
    status: 'active',
    startDate: now,
    endDate,
    generationsUsed: 0,
    lastRenewal: now,
    autoRenew: false
  };
}

export async function canUserGenerateDesign(userId: string): Promise<{
  canGenerate: boolean;
  reason?: string;
  subscription?: UserSubscription;
}> {
  try {
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      return { canGenerate: false, reason: 'No subscription found' };
    }
    
    if (subscription.status !== 'active') {
      return { 
        canGenerate: false, 
        reason: 'Subscription is not active', 
        subscription 
      };
    }
    
    const now = admin.firestore.Timestamp.now();
    if (subscription.endDate.toMillis() < now.toMillis()) {
      return { 
        canGenerate: false, 
        reason: 'Subscription has expired', 
        subscription 
      };
    }
    
    const plan = subscriptionPlans[subscription.planId];
    if (subscription.generationsUsed >= plan.generationsPerMonth) {
      return { 
        canGenerate: false, 
        reason: 'Generation limit reached for this billing period', 
        subscription 
      };
    }
    
    return { canGenerate: true, subscription };
  } catch (error) {
    logger.error(`Error checking if user ${userId} can generate design:`, error);
    return { canGenerate: false, reason: 'Error checking subscription status' };
  }
}

export async function incrementGenerationsUsed(userId: string): Promise<boolean> {
  try {
    const db = admin.firestore();
    await db.collection('subscriptions').doc(userId).update({
      generationsUsed: admin.firestore.FieldValue.increment(1)
    });
    return true;
  } catch (error) {
    logger.error(`Error incrementing generations used for user ${userId}:`, error);
    return false;
  }
}

export async function updateUserSubscription(
  userId: string, 
  planId: SubscriptionPlanType
): Promise<boolean> {
  try {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    
    const endDate = admin.firestore.Timestamp.fromDate(
      new Date(now.toDate().setMonth(now.toDate().getMonth() + 1))
    );
    
    await db.collection('subscriptions').doc(userId).update({
      planId,
      status: 'active',
      startDate: now,
      endDate,
      generationsUsed: 0,
      lastRenewal: now,
      autoRenew: planId !== SubscriptionPlanType.FREE
    });
    
    return true;
  } catch (error) {
    logger.error(`Error updating subscription for user ${userId}:`, error);
    return false;
  }
}
