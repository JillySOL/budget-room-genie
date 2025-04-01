# RenoMate - Modern Web Architecture

## Overview
RenoMate is a web application that uses AI to generate room renovation designs. The application is built using a modern tech stack, combining Clerk for authentication, AWS for backend services, and React for the frontend.

## Architecture

### Frontend
- **Framework**: React with TypeScript
- **UI Components**: Radix UI + Tailwind CSS
- **Authentication**: Clerk
- **Storage**: AWS S3 for image uploads
- **Routing**: React Router
- **Styling**: Tailwind CSS with custom RenoMate theme

### Backend
- **API**: AWS API Gateway (HTTP API)
- **Compute**: AWS Lambda
- **Database**: Amazon Aurora Serverless v2 (Postgres)
- **Authentication**: Clerk
- **Storage**: Amazon S3
- **Infrastructure as Code**: AWS CDK (TypeScript)

### Key Components

#### Authentication Flow
1. User signs up/signs in through Clerk UI
2. Clerk handles authentication and session management
3. Frontend receives Clerk session token
4. API Gateway validates tokens using Clerk JWT verification
5. Lambda functions receive user context in the event

#### Database Schema
```sql
-- Users table
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_pro BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
  project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(user_id),
  title TEXT NOT NULL,
  room_type TEXT NOT NULL,
  style TEXT NOT NULL,
  budget_range TEXT NOT NULL,
  suggestions JSONB,
  cost_estimate INTEGER,
  value_gain INTEGER,
  render_s3_key TEXT,
  original_s3_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Render logs table
CREATE TABLE render_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(user_id),
  project_id UUID REFERENCES projects(project_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### API Endpoints
- `POST /ai` - AI design generation (protected)
- `POST /webhook` - Stripe webhook handler
- `POST /projects` - Save project (protected)
- `GET /projects` - List user's projects (protected)

### Infrastructure

#### VPC Configuration
- VPC with 2 AZs
- Private subnets with NAT Gateway
- Security groups for Lambda and Aurora

#### Lambda Functions
1. **AI Proxy Function**
   - Interfaces with OpenAI API
   - Manages image generation
   - Handles freemium logic

2. **Stripe Webhook Function**
   - Processes subscription events
   - Updates user pro status
   - Manages subscription lifecycle

3. **DB Init Function**
   - Initializes database schema
   - Creates required tables and indexes
   - Runs as custom resource in CDK

### Security
- All API endpoints require Clerk authentication
- S3 bucket with CORS configuration
- Secrets stored in AWS Secrets Manager
- VPC isolation for database and Lambda functions
- IAM roles with least privilege principle

### Development Setup

1. **Prerequisites**
   ```bash
   # Install AWS CDK
   npm install -g aws-cdk

   # Install project dependencies
   npm install
   ```

2. **Environment Variables**
   ```env
   # Frontend
   VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
   VITE_AWS_REGION=your-region
   VITE_AWS_ACCESS_KEY_ID=your-access-key
   VITE_AWS_SECRET_ACCESS_KEY=your-secret-key
   VITE_S3_BUCKET_NAME=your-bucket-name
   VITE_API_ENDPOINT=your-api-endpoint

   # Backend
   AWS_REGION=your-region
   AWS_ACCOUNT=your-account-id
   ```

3. **Deployment**
   ```bash
   # Deploy infrastructure
   cd infrastructure
   cdk deploy

   # Build and deploy frontend
   cd ..
   npm run build
   ```

### Cost Optimization
- Aurora Serverless v2 scales to zero when inactive
- Lambda functions use appropriate memory sizes
- S3 lifecycle policies for image cleanup
- CloudFront for static content delivery

### Monitoring and Logging
- CloudWatch Logs for Lambda functions
- CloudWatch Metrics for API Gateway
- Aurora performance insights
- S3 access logs

### Future Improvements
1. Implement CloudFront for API caching
2. Add DynamoDB for high-frequency operations
3. Set up AWS WAF for API protection
4. Implement AWS Backup for database
5. Add AWS X-Ray for tracing

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.
