import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DatabaseProps {
  vpc: ec2.IVpc;
  securityGroups: ec2.ISecurityGroup[];
}

export class Database extends Construct {
  public readonly cluster: rds.IDatabaseCluster;
  public readonly secret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    // Create a secret for the database credentials
    this.secret = new secretsmanager.Secret(this, 'Secret', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludePunctuation: true,
      },
    });

    // Create the Aurora Serverless v2 cluster
    this.cluster = new rds.DatabaseCluster(this, 'RenoMateDB', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_13_9,
      }),
      writer: rds.ClusterInstance.serverlessV2('Writer', {
        scaleWithWriter: true,
      }),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: props.securityGroups,
      credentials: rds.Credentials.fromSecret(this.secret),
      defaultDatabaseName: 'renomate',
      parameterGroup: new rds.ParameterGroup(this, 'ParameterGroup', {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_13_9,
        }),
        parameters: {
          'timezone': 'UTC',
        },
      }),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
} 