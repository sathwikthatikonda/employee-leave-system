import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class LeaveManagementStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // =========================================================================
    // 1. DYNAMODB TABLES
    // =========================================================================
    
    // Employees Table (Holds profiles, roles, and leave balances)
    const employeesTable = new dynamodb.Table(this, 'EmployeesTable', {
      partitionKey: { name: 'employeeId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For local test sandbox
      tableName: 'Employees',
    });

    // Leave Requests Table
    const leaveRequestsTable = new dynamodb.Table(this, 'LeaveRequestsTable', {
      partitionKey: { name: 'requestId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: 'LeaveRequests',
    });

    // Add Global Secondary Index on employeeId for leave-request lookups
    leaveRequestsTable.addGlobalSecondaryIndex({
      indexName: 'EmployeeIndex',
      partitionKey: { name: 'employeeId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // =========================================================================
    // 2. COGNITO USER POOL & TRIGGER
    // =========================================================================

    // Auth Trigger Lambda (triggers on registration confirmation to save to DynamoDB)
    const authTriggerLambda = new lambda.Function(this, 'AuthTriggerLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/auth-trigger')),
      environment: {
        USERS_TABLE: employeesTable.tableName,
      },
    });
    employeesTable.grantWriteData(authTriggerLambda);

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'ElmsUserPool', {
      userPoolName: 'ELMS-UserPool',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: true, mutable: true },
      },
      customAttributes: {
        role: new cognito.StringAttribute({ mutable: true }), // 'Employee', 'Manager', 'HR'
      },
      lambdaTriggers: {
        postConfirmation: authTriggerLambda, // Connect DB auto-provisioning
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = userPool.addClient('ElmsUserPoolClient', {
      authFlows: {
        userSrp: true,
      },
    });

    // =========================================================================
    // 3. LAMBDA API HANDLERS
    // =========================================================================

    // Leaves Management Handler (POST /leaves, GET /leaves, PUT /leaves/{id}/status)
    const leavesHandler = new lambda.Function(this, 'LeavesHandlerLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/leaves-handler')),
      environment: {
        LEAVES_TABLE: leaveRequestsTable.tableName,
      },
    });
    leaveRequestsTable.grantReadWriteData(leavesHandler);

    // User Profiles Handler (GET /users, GET /users/{id}, PUT /users/{id}/balances)
    const usersHandler = new lambda.Function(this, 'UsersHandlerLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/users-handler')),
      environment: {
        USERS_TABLE: employeesTable.tableName,
      },
    });
    employeesTable.grantReadWriteData(usersHandler);


    // =========================================================================
    // 4. API GATEWAY INTEGRATION
    // =========================================================================

    const api = new apigateway.RestApi(this, 'ElmsRestApi', {
      restApiName: 'ELMS Service API',
      description: 'API services for Employee Leave Management System.',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
      },
    });

    const leavesResource = api.root.addResource('leaves');
    leavesResource.addMethod('POST', new apigateway.LambdaIntegration(leavesHandler));
    leavesResource.addMethod('GET', new apigateway.LambdaIntegration(leavesHandler));

    const singleLeaveStatus = leavesResource.addResource('{id}').addResource('status');
    singleLeaveStatus.addMethod('PUT', new apigateway.LambdaIntegration(leavesHandler));

    const usersResource = api.root.addResource('users');
    usersResource.addMethod('GET', new apigateway.LambdaIntegration(usersHandler));
    
    const singleUserBalances = usersResource.addResource('{id}').addResource('balances');
    singleUserBalances.addMethod('PUT', new apigateway.LambdaIntegration(usersHandler));


    // =========================================================================
    // 5. S3 & CLOUDFRONT (FRONTEND HOSTING)
    // =========================================================================

    // S3 Bucket for web hosting
    const siteBucket = new s3.Bucket(this, 'ElmsFrontendBucket', {
      bucketName: `elms-frontend-hosting-${this.account}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront Origin Access Identity
    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, 'ElmsOAI');
    siteBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [siteBucket.arnForObjects('*')],
      principals: [new iam.CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
    }));

    // CloudFront Distribution
    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'ElmsCFDistribution', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: siteBucket,
            originAccessIdentity: cloudfrontOAI,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
      errorConfigurations: [
        {
          errorCode: 404,
          responseCode: 200,
          errorCachingMinTtl: 0,
          responsePagePath: '/index.html', // Essential for Single Page React Routing
        },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'ApiGatewayUrl', { value: api.url });
    new cdk.CfnOutput(this, 'CloudFrontUrl', { value: distribution.distributionDomainName });
  }
}
