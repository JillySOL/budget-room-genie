import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface AuthProps {
  vpc: ec2.IVpc;
  securityGroups: ec2.ISecurityGroup[];
  dbSecretName: string;
}

export class Auth extends Construct {
  public readonly userPool: cognito.IUserPool;
  public readonly userPoolClient: cognito.IUserPoolClient;
  public readonly authFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: AuthProps) {
    super(scope, id);

    // Create Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'RenoMateUserPool', {
      userPoolName: 'renomate-users',
      selfSignUpEnabled: true,
      autoVerify: {
        email: true,
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
    });

    // Create User Pool Client
    this.userPoolClient = this.userPool.addClient('RenoMateUserPoolClient', {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: ['http://localhost:3000'],
        logoutUrls: ['http://localhost:3000'],
      },
    });

    // Create auth function
    this.authFunction = new lambda.Function(this, 'AuthFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/auth'),
      timeout: cdk.Duration.seconds(30),
      vpc: props.vpc,
      securityGroups: props.securityGroups,
      environment: {
        COGNITO_CLIENT_ID: this.userPoolClient.userPoolClientId,
        DB_SECRET_NAME: props.dbSecretName,
      },
    });
  }
} 