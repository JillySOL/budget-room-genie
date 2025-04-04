# RenoMate System Architecture

## Overview
RenoMate is a web application that enables users to visualize room renovations using AI. Users can upload photos, specify renovation details, and receive AI-generated visualizations along with DIY suggestions.

## Current Infrastructure

### Frontend
- **Technology**: React with Vite
- **Hosting**: Vercel
- **Authentication**: Cognito (Migrated from Clerk)
- **Key Libraries**: 
  - React Router for navigation
  - Tailwind CSS and Shadcn UI for styling

### Backend Services

#### API Gateway
- **Endpoint**: `https://rrmgaapv6f.execute-api.ap-southeast-2.amazonaws.com/prod/`
- **Authorization**: Cognito JWT Auth
- **Routes**:
  - `POST /generate-upload-url` → AuthFunction
  - `GET /my-photos` → AuthFunction
  - `GET /generation-status/{jobId}` → AuthFunction
  - `POST /save-project` → AuthFunction
  - `GET /projects` → AuthFunction
  - `GET /project/{projectId}` → AuthFunction
  - `POST /start-generation` → AuthFunction

#### Lambda Functions
1. **AuthFunction**
   - Runtime: Node.js 22.x
   - Role: AuthFunction-LambdaRole
   - Purpose: Handles all API operations including image processing, project management, and user authentication

### Storage

#### S3 Buckets
- **Name**: renomate-uploads-jp-12
- **Structure**:
  - `/uploads` - Original user uploads
  - `/results` - Generated images

#### Aurora PostgreSQL Database
- **Instance**: t3.medium
- **Storage**: 20GB
- **Backup**: Automated daily backups
- **Security**: VPC isolation, encryption at rest

### Security

#### IAM Roles
1. **AuthFunction-LambdaRole**
2. **DatabaseAccessRole**
3. **S3AccessRole**
4. **APIGatewayRole**

#### VPC Configuration
- Private subnets for database
- Security groups with least privilege access
- NAT Gateway for outbound internet access

## Infrastructure as Code (CDK)

### Stacks
1. **VpcStack**
   - VPC configuration
   - Subnets
   - Security groups
   - NAT Gateway

2. **StorageStack**
   - S3 bucket
   - Bucket policies
   - CORS configuration

3. **DatabaseStack**
   - Aurora PostgreSQL cluster
   - Database credentials
   - Security groups
   - Backup configuration

4. **AuthStack**
   - Cognito User Pool
   - User Pool Client
   - Auth Lambda function
   - IAM roles and policies

5. **ApiStack**
   - API Gateway
   - Route configurations
   - Authorizers
   - Lambda integrations

### Benefits
- Version controlled infrastructure
- Type-safe configurations
- Automated deployments
- Consistent security policies
- Scalable architecture

### Next Steps
1. Implement monitoring and logging
2. Add automated testing
3. Set up CI/CD pipeline
4. Implement backup and disaster recovery
5. Add performance optimization

## Proposed CDK Implementation

### Approach
Given the existing infrastructure, we recommend:
1. Create a CDK app that imports existing resources
2. Start with one Lambda function as a proof of concept
3. Gradually migrate other functions while maintaining the current system

### Benefits
- Version control for infrastructure
- Type safety with TypeScript
- Automated deployments
- Easier management of permissions and configurations

### Risks and Mitigation
1. **Risk**: Disrupting existing services
   - Mitigation: Use `fromXXXArn()` methods to reference existing resources
   - Mitigation: Start with non-critical functions
   - Mitigation: Implement proper testing

2. **Risk**: Breaking authentication
   - Mitigation: Maintain existing Clerk JWT configuration
   - Mitigation: Test thoroughly in development

3. **Risk**: Data loss
   - Mitigation: Don't modify existing DynamoDB tables
   - Mitigation: Keep existing S3 bucket configuration

## Next Steps
1. Set up CDK development environment
2. Create initial CDK app structure
3. Import existing resources
4. Start with one Lambda function (suggest: RenoMate-GetProject)
5. Test thoroughly
6. Gradually expand to other functions

Would you like to proceed with this approach? 