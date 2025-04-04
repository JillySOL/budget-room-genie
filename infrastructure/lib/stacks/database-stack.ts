import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Database } from '../constructs/database';
import { VpcStack } from './vpc-stack';

export class DatabaseStack extends cdk.Stack {
  public readonly database: Database;

  constructor(scope: Construct, id: string, vpcStack: VpcStack, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create database resources
    this.database = new Database(this, 'RenoMateDB', {
      vpc: vpcStack.vpc.vpc,
      securityGroups: [vpcStack.vpc.databaseSecurityGroup],
    });
  }
} 