import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface StorageProps {}

export class Storage extends Construct {
  public readonly bucket: s3.IBucket;

  constructor(scope: Construct, id: string, props?: StorageProps) {
    super(scope, id);

    // Import existing S3 bucket
    this.bucket = s3.Bucket.fromBucketName(
      this,
      'RenoMateImagesBucket',
      `renomate-images-${cdk.Stack.of(this).account}`
    );
  }
} 