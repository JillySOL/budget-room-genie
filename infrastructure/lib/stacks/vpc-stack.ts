import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Vpc } from '../constructs/vpc';

export class VpcStack extends cdk.Stack {
  public readonly vpc: Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC and networking components
    this.vpc = new Vpc(this, 'RenoMateVPC');
  }
} 