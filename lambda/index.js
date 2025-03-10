const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const s3Client = new S3Client({ region: "us-east-1" });
const dynamoClient = new DynamoDBClient({ region: "us-east-1" });

async function streamToBuffer(stream) {
	const chunks = [];
	for await (const chunk of stream) {
		chunks.push(chunk);
	}
	return Buffer.concat(chunks);
}

function generateRandomMetadata() {
	const artists = ["John Doe", "Emma Smith", "Michael Lee", "Sophia Johnson"];
	const descriptions = ["Landscape", "Abstract", "Digital Art", "Traditional"];
	const year = new Date().getFullYear();
	return {
		artist: artists[Math.floor(Math.random() * artists.length)],
		copyright: `© ${year} ${artists[Math.floor(Math.random() * artists.length)]}`,
		description: descriptions[Math.floor(Math.random() * descriptions.length)],
	};
}

exports.handler = async (event) => {
	const sourceBucket = event.Records[0].s3.bucket.name;
	let objectKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
	const destinationBucket = process.env.PROCESSED_BUCKET_NAME;
	const tableName = process.env.DYNAMODB_TABLE_NAME;
	try {
		const metadata = generateRandomMetadata();
		const getObjectParams = { Bucket: sourceBucket, Key: objectKey };
		const { Body } = await s3Client.send(new GetObjectCommand(getObjectParams));
		const buffer = await streamToBuffer(Body);
		await s3Client.send(new PutObjectCommand({
			Bucket: destinationBucket,
			Key: objectKey,
			Body: buffer,
			Metadata: metadata,
		}));

		await dynamoClient.send(new PutItemCommand({
			TableName: tableName,
			Item: {
				imageKey: { S: objectKey.replace(/\s/g, "") },
				bucketName: { S: destinationBucket },
				artist: { S: metadata.artist },
				copyright: { S: metadata.copyright },
				description: { S: metadata.description },
				imageValue : { S: objectKey },
				timestamp: { S: new Date().toISOString() },
			},
		}));

		return { statusCode: 200, body: "Image processed successfully" };
	} catch (error) {
		console.error("Error:", error);
		return { statusCode: 500, body: "Error processing image" };
	}
}; 
