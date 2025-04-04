#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/stacks/vpc-stack';
import { StorageStack } from '../lib/stacks/storage-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { AuthStack } from '../lib/stacks/auth-stack';
import { ApiStack } from '../lib/stacks/api-stack';

const app = new cdk.App();

// Deploy VPC stack separately
const vpcStack = new VpcStack(app, 'RenoMateVpcStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// Deploy Storage stack
const storageStack = new StorageStack(app, 'RenoMateStorageStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// Deploy Database stack
const databaseStack = new DatabaseStack(app, 'RenoMateDatabaseStack', vpcStack, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// Deploy Auth stack
const authStack = new AuthStack(app, 'RenoMateAuthStack', vpcStack, databaseStack, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// Deploy API stack
new ApiStack(app, 'RenoMateApiStack', vpcStack, databaseStack, authStack, storageStack, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

app.synth(); 