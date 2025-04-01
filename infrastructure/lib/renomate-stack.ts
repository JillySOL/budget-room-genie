import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class RenoMateStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC for Aurora
    const vpc = new ec2.Vpc(this, 'RenoMateVPC', {
      maxAzs: 2,
      natGateways: 1,
    });

    // Create Aurora Serverless v2 cluster
    const dbCluster = new rds.ServerlessCluster(this, 'RenoMateDB', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({ version: rds.AuroraPostgresEngineVersion.VER_15_3 }),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      scaling: {
        minCapacity: rds.AuroraCapacityUnit.ACU_1,
        maxCapacity: rds.AuroraCapacityUnit.ACU_16,
        autoPause: cdk.Duration.minutes(5),
      },
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(
        this,
        'DBParameterGroup',
        'default.aurora-postgresql15'
      ),
      defaultDatabaseName: 'renomate',
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
    });

    // Create db-init Lambda function
    const dbInitFunction = new lambda.Function(this, 'DBInitFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/db-init'),
      environment: {
        DB_SECRET_NAME: dbCluster.secret!.secretName,
      },
      timeout: cdk.Duration.seconds(30),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Grant Aurora access to db-init Lambda
    dbCluster.grantDataApiAccess(dbInitFunction);

    // Create trigger function for db-init
    const dbInitTriggerFunction = new lambda.Function(this, 'DBInitTriggerFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const lambda = new AWS.Lambda();

        exports.handler = async (event) => {
          if (event.RequestType === 'Create' || event.RequestType === 'Update') {
            try {
              await lambda.invoke({
                FunctionName: '${dbInitFunction.functionName}',
                InvocationType: 'RequestResponse'
              }).promise();
              return cfnResponse.send(event, cfnResponse.SUCCESS, {});
            } catch (error) {
              console.error('Error invoking db-init:', error);
              return cfnResponse.send(event, cfnResponse.FAILED, { error: error.message });
            }
          }
          return cfnResponse.send(event, cfnResponse.SUCCESS, {});
        };
      `),
      timeout: cdk.Duration.seconds(30),
      initialPolicy: [
        new iam.PolicyStatement({
          actions: ['lambda:InvokeFunction'],
          resources: [dbInitFunction.functionArn],
        }),
      ],
    });

    // Create custom resource to trigger db-init
    const dbInitTrigger = new cdk.CustomResource(this, 'DBInitTrigger', {
      serviceToken: dbInitTriggerFunction.functionArn,
    });

    // Add dependency to ensure db-init runs after Aurora is ready
    dbInitTrigger.node.addDependency(dbCluster);

    // Create Cognito User Pool
    const userPool = new cognito.UserPool(this, 'RenoMateUserPool', {
      userPoolName: 'renomate-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create Cognito App Client
    const userPoolClient = new cognito.UserPoolClient(this, 'RenoMateUserPoolClient', {
      userPool,
      userPoolClientName: 'renomate-client',
      authFlows: {
        userPassword: true,
      },
      oAuth: {
        flows: {
          implicitCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID],
        callbackUrls: ['http://localhost:5173'], // Update with your frontend URL
        logoutUrls: ['http://localhost:5173'], // Update with your frontend URL
      },
    });

    // Create S3 bucket for image uploads
    const imageBucket = new s3.Bucket(this, 'ImageBucket', {
      bucketName: `renomate-images-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ['*'], // TODO: Restrict to your domain in production
          allowedHeaders: ['*'],
        },
      ],
    });

    // Create Lambda functions
    const aiProxyFunction = new lambda.Function(this, 'AIProxyFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/ai-proxy'),
      environment: {
        OPENAI_API_KEY_SECRET_NAME: 'renomate/openai-api-key',
        DB_SECRET_NAME: dbCluster.secret!.secretName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    const stripeWebhookFunction = new lambda.Function(this, 'StripeWebhookFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/stripe-webhook'),
      environment: {
        STRIPE_WEBHOOK_SECRET_NAME: 'renomate/stripe-webhook-secret',
        STRIPE_SECRET_KEY_NAME: 'renomate/stripe-secret-key',
        DB_SECRET_NAME: dbCluster.secret!.secretName,
      },
      timeout: cdk.Duration.seconds(30),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'RenoMateApi', {
      restApiName: 'RenoMate API',
      description: 'API for RenoMate MVP 2.0',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    // Create Cognito Authorizer
    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
    });

    // Add API endpoints
    const aiEndpoint = api.root.addResource('ai');
    aiEndpoint.addMethod('POST', new apigateway.LambdaIntegration(aiProxyFunction), {
      authorizer: cognitoAuthorizer,
    });

    const stripeWebhookEndpoint = api.root.addResource('webhook');
    stripeWebhookEndpoint.addMethod('POST', new apigateway.LambdaIntegration(stripeWebhookFunction));

    // Grant permissions
    imageBucket.grantReadWrite(aiProxyFunction);

    // Grant Secrets Manager access to Lambda functions
    const secretsPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['secretsmanager:GetSecretValue'],
      resources: [
        `arn:aws:secretsmanager:${this.region}:${this.account}:secret:renomate/*`,
      ],
    });

    aiProxyFunction.addToRolePolicy(secretsPolicy);
    stripeWebhookFunction.addToRolePolicy(secretsPolicy);

    // Grant Aurora access to Lambda functions
    dbCluster.grantDataApiAccess(aiProxyFunction);
    dbCluster.grantDataApiAccess(stripeWebhookFunction);

    // Create Secrets Manager secrets
    new secretsmanager.Secret(this, 'OpenAIApiKeySecret', {
      secretName: 'renomate/openai-api-key',
      description: 'OpenAI API Key for RenoMate',
      generateSecretString: {
        generateStringKey: 'apiKey',
        secretStringTemplate: JSON.stringify({ username: 'renomate' }),
        excludePunctuation: true,
        passwordLength: 64,
      },
    });

    new secretsmanager.Secret(this, 'StripeWebhookSecret', {
      secretName: 'renomate/stripe-webhook-secret',
      description: 'Stripe Webhook Secret for RenoMate',
      generateSecretString: {
        generateStringKey: 'webhookSecret',
        secretStringTemplate: JSON.stringify({ username: 'renomate' }),
        excludePunctuation: true,
        passwordLength: 64,
      },
    });

    new secretsmanager.Secret(this, 'StripeSecretKey', {
      secretName: 'renomate/stripe-secret-key',
      description: 'Stripe Secret Key for RenoMate',
      generateSecretString: {
        generateStringKey: 'secretKey',
        secretStringTemplate: JSON.stringify({ username: 'renomate' }),
        excludePunctuation: true,
        passwordLength: 64,
      },
    });

    // Create auth Lambda function
    const authFunction = new lambda.Function(this, 'AuthFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/auth'),
      environment: {
        COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
        DB_SECRET_NAME: dbCluster.secret!.secretName,
      },
      timeout: cdk.Duration.seconds(30),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Grant Aurora access to auth Lambda
    dbCluster.grantDataApiAccess(authFunction);

    // Add auth endpoints to API Gateway
    const authEndpoint = api.root.addResource('auth');
    const authActionEndpoint = authEndpoint.addResource('{action}');
    authActionEndpoint.addMethod('POST', new apigateway.LambdaIntegration(authFunction));

    // Grant Secrets Manager access to auth Lambda
    authFunction.addToRolePolicy(secretsPolicy);

    // Output important values
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'ImageBucketName', {
      value: imageBucket.bucketName,
      description: 'S3 bucket for image uploads',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'DBClusterEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
      description: 'Aurora Serverless v2 cluster endpoint',
    });
  }
} 