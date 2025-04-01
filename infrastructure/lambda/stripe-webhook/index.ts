import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import Stripe from 'stripe';

const secretsManager = new SecretsManagerClient();
const dynamodb = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamodb);

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    // Get Stripe webhook secret from Secrets Manager
    const secretResponse = await secretsManager.send(
      new GetSecretValueCommand({
        SecretId: process.env.STRIPE_WEBHOOK_SECRET_NAME,
      })
    );

    const stripeWebhookSecret = JSON.parse(secretResponse.SecretString || '{}').webhookSecret;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16',
    });

    // Verify webhook signature
    const signature = event.headers['stripe-signature'];
    if (!signature) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing stripe-signature header' }),
      };
    }

    let stripeEvent: Stripe.Event;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body,
        signature,
        stripeWebhookSecret
      );
    } catch (err) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid webhook signature' }),
      };
    }

    // Handle different event types
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Update user record with Stripe information
        await docClient.send(
          new UpdateCommand({
            TableName: 'RenoMateUsers',
            Key: { id: session.client_reference_id },
            UpdateExpression: 'SET is_pro = :isPro, stripe_customer_id = :customerId, stripe_subscription_id = :subscriptionId',
            ExpressionAttributeValues: {
              ':isPro': true,
              ':customerId': customerId,
              ':subscriptionId': subscriptionId,
            },
          })
        );
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const user = await docClient.send(
          new UpdateCommand({
            TableName: 'RenoMateUsers',
            Key: { stripe_customer_id: customerId },
            UpdateExpression: 'SET is_pro = :isPro, stripe_subscription_id = :subscriptionId',
            ExpressionAttributeValues: {
              ':isPro': subscription.status === 'active',
              ':subscriptionId': subscription.id,
            },
          })
        );
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Update user's pro status to false
        await docClient.send(
          new UpdateCommand({
            TableName: 'RenoMateUsers',
            Key: { stripe_customer_id: customerId },
            UpdateExpression: 'SET is_pro = :isPro',
            ExpressionAttributeValues: {
              ':isPro': false,
            },
          })
        );
        break;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
} 