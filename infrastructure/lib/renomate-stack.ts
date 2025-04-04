import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { Vpc } from './constructs/vpc';
import { Database } from './constructs/database';
import { Secrets } from './constructs/secrets';
import { Auth } from './constructs/auth';
import { Api } from './constructs/api';
import { Storage } from './constructs/storage';

export class RenoMateStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC and networking components
    const vpc = new Vpc(this, 'RenoMateVPC');

    // Create database with security groups
    const database = new Database(this, 'Database', {
      vpc: vpc.vpc,
      securityGroups: [vpc.databaseSecurityGroup],
    });

    // Create secrets
    const secrets = new Secrets(this, 'Secrets');

    // Create authentication components
    const auth = new Auth(this, 'Auth', {
      vpc: vpc.vpc,
      securityGroups: [vpc.databaseSecurityGroup],
      dbSecretName: database.secret.secretName,
    });

    // Import existing Lambda functions
    const existingLambdas = {
      generatePresignedUrl: lambda.Function.fromFunctionName(
        this,
        'ExistingGeneratePresignedUrlLambda',
        'RenoMate-GeneratePresignedUrl'
      ),
      listUserPhotos: lambda.Function.fromFunctionName(
        this,
        'ExistingListUserPhotosLambda',
        'RenoMate-ListUserPhotos'
      ),
      getStatusResult: lambda.Function.fromFunctionName(
        this,
        'ExistingGetStatusResultLambda',
        'RenoMate-GetStatusResult'
      ),
      saveProject: lambda.Function.fromFunctionName(
        this,
        'ExistingSaveProjectLambda',
        'RenoMate-SaveProject'
      ),
      listUserProjects: lambda.Function.fromFunctionName(
        this,
        'ExistingListUserProjectsLambda',
        'RenoMate-ListUserProjects'
      ),
      getProject: lambda.Function.fromFunctionName(
        this,
        'ExistingGetProjectLambda',
        'RenoMate-GetProject'
      ),
      processImage: lambda.Function.fromFunctionName(
        this,
        'ExistingProcessImageLambda',
        'RenoMate-ProcessImage'
      ),
    };

    // Create Clerk authorizer function
    const clerkAuthorizerFunction = new lambda.Function(this, 'ClerkAuthorizerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/clerk-authorizer'),
      environment: {
        CLERK_SECRET_KEY_NAME: 'renomate/clerk-secret-key',
      },
    });

    // Create API Gateway and endpoints
    const api = new Api(this, 'Api', {
      vpc: vpc.vpc,
      userPool: auth.userPool,
      secrets: secrets,
      existingLambdas,
    });

    // Create storage components
    const storage = new Storage(this, 'Storage');

    // Output important values
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'ImageBucketName', {
      value: storage.bucket.bucketName,
      description: 'S3 bucket for image uploads',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: auth.userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: auth.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'DatabaseClusterEndpoint', {
      value: database.cluster.clusterEndpoint.hostname,
      description: 'Aurora Serverless v2 cluster endpoint',
    });
  }
} 