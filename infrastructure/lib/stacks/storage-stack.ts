import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Storage } from '../constructs/storage';

export class StorageStack extends cdk.Stack {
  public readonly storage: Storage;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create storage resources
    this.storage = new Storage(this, 'RenoMateStorage');
  }
} 