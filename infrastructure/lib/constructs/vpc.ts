import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface VpcProps {}

export class Vpc extends Construct {
  public readonly vpc: ec2.IVpc;
  public readonly databaseSecurityGroup: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props?: VpcProps) {
    super(scope, id);

    // Create VPC
    this.vpc = new ec2.Vpc(this, 'RenoMateVPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // Create security group for database
    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Aurora database',
      allowAllOutbound: true,
    });

    // Allow inbound PostgreSQL traffic
    this.databaseSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from within VPC'
    );
  }
} 