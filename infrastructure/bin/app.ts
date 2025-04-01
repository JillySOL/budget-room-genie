#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RenoMateStack } from '../lib/renomate-stack';

const app = new cdk.App();

new RenoMateStack(app, 'RenoMateStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-southeast-2', // Default to Sydney region
  },
  description: 'RenoMate MVP 2.0 Infrastructure',
}); 