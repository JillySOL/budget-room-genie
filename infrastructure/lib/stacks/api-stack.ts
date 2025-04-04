import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Api } from '../constructs/api';
import { VpcStack } from './vpc-stack';
import { DatabaseStack } from './database-stack';
import { AuthStack } from './auth-stack';
import { StorageStack } from './storage-stack';
import { Secrets } from '../constructs/secrets';

export class ApiStack extends cdk.Stack {
  public readonly api: Api;

  constructor(
    scope: Construct,
    id: string,
    vpcStack: VpcStack,
    databaseStack: DatabaseStack,
    authStack: AuthStack,
    storageStack: StorageStack,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    // Create secrets
    const secrets = new Secrets(this, 'RenoMateSecrets', {
      dbSecretName: databaseStack.database.secret.secretName,
    });

    // Create API resources
    this.api = new Api(this, 'RenoMateApi', {
      vpc: vpcStack.vpc.vpc,
      userPool: authStack.auth.userPool,
      secrets,
      existingLambdas: {
        generatePresignedUrl: authStack.auth.authFunction,
        listUserPhotos: authStack.auth.authFunction,
        getStatusResult: authStack.auth.authFunction,
        saveProject: authStack.auth.authFunction,
        listUserProjects: authStack.auth.authFunction,
        getProject: authStack.auth.authFunction,
        processImage: authStack.auth.authFunction,
      },
    });
  }
} 