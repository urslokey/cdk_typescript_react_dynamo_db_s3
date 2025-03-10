import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as eventsources from "aws-cdk-lib/aws-lambda-event-sources";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";

export class ServerlessStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);
		//  Create S3 Buckets
		const originalBucket = new s3.Bucket(this, "OriginalImagesBucket", {
			bucketName: "case-study-original-images",
			removalPolicy: cdk.RemovalPolicy.RETAIN,
		});

		const processedBucket = new s3.Bucket(this, "ProcessedImagesBucket", {
			bucketName: "case-study-processed-images",
			removalPolicy: cdk.RemovalPolicy.RETAIN,
			// blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
			// publicReadAccess: true,
			// accessControl: s3.BucketAccessControl.PUBLIC_READ
			blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS, 
			publicReadAccess: false, 
		});

		processedBucket.addToResourcePolicy(
			new iam.PolicyStatement({
				effect: iam.Effect.ALLOW,
				actions: ["s3:GetObject"],
				resources: [`${processedBucket.bucketArn}/*`],
				principals: [new iam.AnyPrincipal()], // Public access
			})
		);


		//  Create DynamoDB Table
		const metadataTable = new dynamodb.Table(this, "ProcessedImagesMetaList", {
			tableName: "ProcessedImagesMetaList",
			partitionKey: { name: "imageKey", type: dynamodb.AttributeType.STRING },
			removalPolicy: cdk.RemovalPolicy.RETAIN,
		});
		//  Create Image Processing Lambda
		const imageProcessorLambda = new lambda.Function(this, "ImageProcessorLambda", {
			runtime: lambda.Runtime.NODEJS_18_X,
			handler: "index.handler",
			code: lambda.Code.fromAsset("lambda"),
			environment: {
				PROCESSED_BUCKET_NAME: processedBucket.bucketName,
				DYNAMODB_TABLE_NAME: metadataTable.tableName,
			},
		});
		originalBucket.grantRead(imageProcessorLambda);
		processedBucket.grantPut(imageProcessorLambda);
		metadataTable.grantWriteData(imageProcessorLambda);
		//  Add S3 Trigger for Lambda
		imageProcessorLambda.addEventSource(new eventsources.S3EventSource(originalBucket, {
			events: [s3.EventType.OBJECT_CREATED],
		}));

		
		//  Create Cognito User Pool
		const userPool = new cognito.UserPool(this, "ImageGalleryUserPool", {
			userPoolName: "ImageGalleryUserPool",
			selfSignUpEnabled: true,
			signInAliases: { email:true },
			autoVerify: { email: false },
			standardAttributes: {
				email: { required: true, mutable: true },
			},
			passwordPolicy: {
				minLength: 6,
				requireLowercase: false,
				requireUppercase: false,
				requireDigits: false,
				requireSymbols: false,
			},
			accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
		});
		//  Create User Pool App Client
		const userPoolClient = new cognito.UserPoolClient(this, "ImageGalleryUserPoolClient", {
			userPool,
			generateSecret: false,
		});

		//  Create API Lambda to Fetch Metadata
		const getMetadataLambda = new lambda.Function(this, "GetImageMetadataLambda", {
			runtime: lambda.Runtime.NODEJS_18_X,
			handler: "getMetadata.handler",
			code: lambda.Code.fromAsset("lambda"),
			environment: {
				DYNAMODB_TABLE_NAME: metadataTable.tableName,
				PROCESSED_BUCKET_NAME: processedBucket.bucketName,
			},
		});
		metadataTable.grantReadData(getMetadataLambda);
		processedBucket.grantRead(getMetadataLambda);

		const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this,"CognitoAPIAuthorizer",{
			cognitoUserPools : [ userPool ]
		});

		//  Create API Gateway for metadata retrieval
		const api = new apigateway.RestApi(this, "ImageMetadataAPI", {
			restApiName: "ImageMetadata Service",
			description: "API for fetching processed images metadata",
			defaultCorsPreflightOptions: {
				allowOrigins: apigateway.Cors.ALL_ORIGINS,
				allowMethods: apigateway.Cors.ALL_METHODS, 
				allowHeaders: [
					"Content-Type",
					"X-Amz-Date",
					"Authorization",
					"X-Api-Key",
					"X-Amz-Security-Token",
				],
			},

		});
		const images = api.root.addResource("images");
		const image = images.addResource("{imageKey}"); // {imageKey} path parameter
		images.addMethod("GET", new apigateway.LambdaIntegration(getMetadataLambda),{
			authorizer
		});
		image.addMethod("GET", new apigateway.LambdaIntegration(getMetadataLambda),{
			authorizer
		});

		// Create an S3 bucket for static website hosting
		 const websiteBucket = new s3.Bucket(this, "ReactAppBucket", {
			websiteIndexDocument: "index.html",
			publicReadAccess: false, 
			blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS, 
			removalPolicy: cdk.RemovalPolicy.DESTROY, 
			autoDeleteObjects: true,
		  });

		// Add a public read policy
		websiteBucket.addToResourcePolicy(
			new iam.PolicyStatement({
			actions: ["s3:GetObject"],
			resources: [`${websiteBucket.bucketArn}/*`],
			principals: [new iam.AnyPrincipal()],
			})
		);
		// Deploy React app files to S3
		new s3deploy.BucketDeployment(this, "DeployReactApp", {
			sources: [s3deploy.Source.asset("./frontend/build")],
			destinationBucket: websiteBucket,
		});




		//  Output values for React app integration
		new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
		new cdk.CfnOutput(this, "UserPoolClientId", { value: userPoolClient.userPoolClientId });
		// Api gateway URL
		new cdk.CfnOutput(this, "ApiGatewayUrl", { value: api.url });
		// Output the S3 website URL
 		//new cdk.CfnOutput(this, "CloudFrontURL", { value: websiteBucket.bucketWebsiteUrl,  description: "URL of the hosted React app" });
		 new cdk.CfnOutput(this, "WebsiteURL", {value: websiteBucket.bucketWebsiteUrl,description: "URL of the hosted React app" });
	}
}
