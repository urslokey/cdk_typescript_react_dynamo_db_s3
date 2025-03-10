const { DynamoDBClient, GetItemCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const dynamoClient = new DynamoDBClient({ region: "us-east-1" });
const tableName = process.env.DYNAMODB_TABLE_NAME;
exports.handler = async (event) => {
	console.log("Received event:", JSON.stringify(event, null, 2));
	// Extract `imageKey` from the request path (if present)
	const imageKey = event.pathParameters ? event.pathParameters.imageKey : null;
	if (imageKey) {
		//  Fetch metadata for a single image
		return await getSingleImageMetadata(imageKey);
	} else {
		//  Fetch metadata for all images
		return await getAllImagesMetadata();
	}
};
//  Get metadata for a specific image
async function getSingleImageMetadata(imageKey) {
	try {
		const result = await dynamoClient.send(new GetItemCommand({
			TableName: tableName,
			Key: { imageKey: { S: imageKey } }
		}));
		if (!result.Item) {
			return { statusCode: 404, body: JSON.stringify({ message: "Image not found" }) };
		}
		return {
			statusCode: 200,
			body: JSON.stringify({
				imageKey: result.Item.imageKey.S,
				bucketName: result.Item.bucketName.S,
				artist: result.Item.artist.S,
				copyright: result.Item.copyright.S,
				description: result.Item.description.S,
				imageValue :  result.Item.imageValue.S,
				timestamp: result.Item.timestamp.S,
				imageUrl: `https://${result.Item.bucketName.S}.s3.us-east-1.amazonaws.com/${result.Item.imageValue.S}`
			}),
			headers: { 
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Content-Type": "application/json"
			}
		};
	} catch (error) {
		console.error("Error retrieving image metadata:", error);
		return { statusCode: 500, body: "Error retrieving image metadata" };
	}
}
//  Get metadata for all images
async function getAllImagesMetadata() {
	try {
		const result = await dynamoClient.send(new ScanCommand({ TableName: tableName }));
		const images = result.Items.map(item => ({
			imageKey: item.imageKey.S,
			bucketName: item.bucketName.S,
			artist: item.artist.S,
			copyright: item.copyright.S,
			description: item.description.S,
			imageValue : item.imageValue.S,
			timestamp: item.timestamp.S,
			imageUrl: `https://${item.bucketName.S}.s3.us-east-1.amazonaws.com/${item.imageValue.S}`
		}));
		return {
			statusCode: 200,
			body: JSON.stringify({ images }),
			headers: { 
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
				"Content-Type": "application/json"
				}
		};
	} catch (error) {
		console.error("Error retrieving images:", error);
		return { statusCode: 500, body: "Error retrieving images" };
	}
}
