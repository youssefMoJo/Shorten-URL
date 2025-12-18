import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ca-central-1" });
const dynamodb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    console.log("EVENT:", JSON.stringify(event));

    const shortCode = event.pathParameters?.short;

    if (!shortCode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing short code" }),
      };
    }

    const result = await dynamodb.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          ShortenedURL: shortCode,
        },
      })
    );

    if (!result.Item || !result.Item.OriginalURL) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "URL not found" }),
      };
    }

    return {
      statusCode: 302,
      headers: {
        Location: result.Item.OriginalURL,
      },
    };
  } catch (error) {
    console.error("ERROR:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
