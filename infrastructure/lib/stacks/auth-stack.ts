import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Auth } from '../constructs/auth';
import { VpcStack } from './vpc-stack';
import { DatabaseStack } from './database-stack';

export class AuthStack extends cdk.Stack {
  public readonly auth: Auth;

  constructor(scope: Construct, id: string, vpcStack: VpcStack, databaseStack: DatabaseStack, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create auth resources
    this.auth = new Auth(this, 'RenoMateAuth', {
      vpc: vpcStack.vpc.vpc,
      securityGroups: [vpcStack.vpc.databaseSecurityGroup],
      dbSecretName: databaseStack.database.secret.secretName,
    });
  }
} 