# RenoMate MVP 2.0

RenoMate is an AI-powered room redesign application that helps users transform their living spaces using advanced AI technology.

## Features

- Real image upload functionality
- AI-powered room redesigns using GPT-4 Vision and DALL-E
- User authentication with email magic links
- Freemium model with subscription support
- Project saving and management
- Secure AWS infrastructure

## Prerequisites

- Node.js 18.x or later
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed globally (`npm install -g aws-cdk`)
- Stripe account with API keys
- OpenAI API key

## Project Structure

```
renomate/
├── src/                    # Frontend React application
├── infrastructure/         # AWS CDK infrastructure code
│   ├── bin/               # CDK app entry point
│   ├── lib/               # CDK stack definitions
│   └── lambda/            # Lambda functions
│       ├── ai-proxy/      # AI request handler
│       └── stripe-webhook/# Stripe webhook handler
└── package.json           # Root package.json
```

## Setup

1. Install dependencies:
   ```bash
   # Install frontend dependencies
   npm install

   # Install infrastructure dependencies
   cd infrastructure
   npm install

   # Install Lambda function dependencies
   cd lambda
   npm install
   ```

2. Configure environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   AWS_REGION=ap-southeast-2
   AWS_ACCOUNT=your-aws-account-id
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
   OPENAI_API_KEY=your-openai-api-key
   ```

3. Deploy infrastructure:
   ```bash
   cd infrastructure
   npm run build
   cdk deploy
   ```

4. Configure Stripe:
   - Create a subscription product in your Stripe dashboard
   - Set up a webhook endpoint pointing to your API Gateway URL
   - Update the webhook secret in AWS Secrets Manager

5. Start the development server:
   ```bash
   npm run dev
   ```

## Development

### Frontend Development

The frontend is built with React, TypeScript, and Tailwind CSS. Key features:

- Image upload with S3 integration
- User authentication with Cognito
- Subscription management with Stripe
- Project management and storage

### Backend Development

The backend infrastructure is managed with AWS CDK and includes:

- API Gateway endpoints
- Lambda functions for AI and webhook handling
- DynamoDB tables for data storage
- S3 bucket for image storage
- Cognito for user authentication
- Secrets Manager for API keys

### Lambda Functions

The application includes two main Lambda functions:

1. AI Proxy Function:
   - Handles image uploads and AI requests
   - Integrates with OpenAI's GPT-4 Vision and DALL-E
   - Manages user quotas and subscription status

2. Stripe Webhook Function:
   - Processes Stripe webhook events
   - Updates user subscription status
   - Handles payment failures and subscription cancellations

## Deployment

1. Build and deploy infrastructure:
   ```bash
   cd infrastructure
   npm run build
   cdk deploy
   ```

2. Build and deploy frontend:
   ```bash
   npm run build
   # Deploy the contents of the dist directory to your hosting service
   ```

## Security

- All API endpoints are secured with Cognito authentication
- API keys are stored in AWS Secrets Manager
- S3 bucket access is restricted to authenticated users
- Stripe webhook signatures are verified
- Data is encrypted at rest and in transit

## Monitoring and Logging

- CloudWatch Logs for Lambda functions
- CloudWatch Metrics for API Gateway and DynamoDB
- Stripe Dashboard for payment monitoring
- Custom metrics for user engagement and AI usage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
