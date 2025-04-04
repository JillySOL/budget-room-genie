#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/stacks/vpc-stack';

const app = new cdk.App();

// Deploy VPC stack separately
new VpcStack(app, 'RenoMateVpcStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
}); 