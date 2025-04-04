import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { Secrets } from './secrets';

export interface ApiProps {
  vpc: ec2.IVpc;
  userPool: cognito.IUserPool;
  secrets: Secrets;
  existingLambdas: {
    generatePresignedUrl: lambda.IFunction;
    listUserPhotos: lambda.IFunction;
    getStatusResult: lambda.IFunction;
    saveProject: lambda.IFunction;
    listUserProjects: lambda.IFunction;
    getProject: lambda.IFunction;
    processImage: lambda.IFunction;
  };
}

export class Api extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    // Create API Gateway
    this.api = new apigateway.RestApi(this, 'RenoMateApi', {
      restApiName: 'RenoMate API',
      description: 'API for RenoMate application',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['*'],
      },
    });

    // Create Cognito authorizer
    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [props.userPool],
    });

    // Create API endpoints
    const photosResource = this.api.root.addResource('my-photos');
    photosResource.addMethod('GET', new apigateway.LambdaIntegration(props.existingLambdas.listUserPhotos), {
      authorizer: cognitoAuthorizer,
    });

    const projectsResource = this.api.root.addResource('projects');
    projectsResource.addMethod('GET', new apigateway.LambdaIntegration(props.existingLambdas.listUserProjects), {
      authorizer: cognitoAuthorizer,
    });

    const projectResource = this.api.root.addResource('project');
    const projectIdResource = projectResource.addResource('{projectId}');
    projectIdResource.addMethod('GET', new apigateway.LambdaIntegration(props.existingLambdas.getProject), {
      authorizer: cognitoAuthorizer,
    });

    const saveProjectResource = this.api.root.addResource('save-project');
    saveProjectResource.addMethod('POST', new apigateway.LambdaIntegration(props.existingLambdas.saveProject), {
      authorizer: cognitoAuthorizer,
    });

    const generateUploadUrlResource = this.api.root.addResource('generate-upload-url');
    generateUploadUrlResource.addMethod('POST', new apigateway.LambdaIntegration(props.existingLambdas.generatePresignedUrl), {
      authorizer: cognitoAuthorizer,
    });

    const startGenerationResource = this.api.root.addResource('start-generation');
    startGenerationResource.addMethod('POST', new apigateway.LambdaIntegration(props.existingLambdas.processImage), {
      authorizer: cognitoAuthorizer,
    });

    const generationStatusResource = this.api.root.addResource('generation-status');
    const jobIdResource = generationStatusResource.addResource('{jobId}');
    jobIdResource.addMethod('GET', new apigateway.LambdaIntegration(props.existingLambdas.getStatusResult), {
      authorizer: cognitoAuthorizer,
    });
  }
} 