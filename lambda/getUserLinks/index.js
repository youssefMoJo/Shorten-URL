import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ca-central-1" });
const dynamodb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    console.log("EVENT:", JSON.stringify(event));

    // Extract userId from JWT claims
    // API Gateway puts claims in requestContext.authorizer.claims
    const userId = event.requestContext?.authorizer?.claims?.sub;

    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "Unauthorized - missing user ID" }),
      };
    }

    // Query the GSI to get all links for this user
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: process.env.TABLE_NAME,
        IndexName: "UserIdIndex",
        KeyConditionExpression: "UserId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
        // Sort by CreatedAt descending (newest first)
        ScanIndexForward: false,
      })
    );

    // Format the response
    const links = result.Items.map((item) => ({
      short_code: item.ShortCode,
      short_url: `https://shorturl.life/${item.ShortCode}`,
      original_url: item.OriginalURL,
      created_at: item.CreatedAt,
    }));

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        count: links.length,
        links: links,
      }),
    };
  } catch (error) {
    console.error("ERROR:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
