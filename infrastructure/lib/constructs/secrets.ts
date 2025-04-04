import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface SecretsProps {}

export class Secrets extends Construct {
  public readonly openAIApiKey: secretsmanager.ISecret;
  public readonly stripeSecretKey: secretsmanager.ISecret;
  public readonly stripeWebhookSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props?: SecretsProps) {
    super(scope, id);

    // Create OpenAI API key secret
    this.openAIApiKey = new secretsmanager.Secret(this, 'OpenAIApiKeySecret', {
      description: 'OpenAI API key for image generation',
    });

    // Create Stripe secret key
    this.stripeSecretKey = new secretsmanager.Secret(this, 'StripeSecretKey', {
      description: 'Stripe secret key for payment processing',
    });

    // Create Stripe webhook secret
    this.stripeWebhookSecret = new secretsmanager.Secret(this, 'StripeWebhookSecret', {
      description: 'Stripe webhook secret for payment events',
    });
  }
} 