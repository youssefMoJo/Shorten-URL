import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { generateSecureShortCode } from "./shared/shortCodeGenerator.js";
import { getUserIdFromEvent } from "./shared/authHelper.js";

const client = new DynamoDBClient({ region: "ca-central-1" });
const dynamodb = DynamoDBDocumentClient.from(client);

const MAX_RETRIES = 5;

export const handler = async (event) => {
  try {
    const body =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    const long_link = body.long_link;

    if (!isValidURL(long_link)) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "Invalid URL" }),
      };
    }

    // Extract userId from JWT token (if authenticated)
    // Supports both API Gateway authorizer claims and manual JWT parsing
    const userId = getUserIdFromEvent(event) || "anonymous";

    // Generate short code with collision handling
    let shortCode;
    let attempts = 0;
    let success = false;

    while (attempts < MAX_RETRIES && !success) {
      shortCode = generateSecureShortCode();
      attempts++;

      try {
        const createdAt = Date.now();

        await dynamodb.send(
          new PutCommand({
            TableName: process.env.TABLE_NAME,
            Item: {
              ShortCode: shortCode,
              OriginalURL: long_link,
              UserId: userId,
              CreatedAt: createdAt,
            },
            // Conditional write - only succeed if ShortCode doesn't exist
            ConditionExpression: "attribute_not_exists(ShortCode)",
          })
        );

        success = true;
      } catch (error) {
        if (error.name === "ConditionalCheckFailedException") {
          // Collision detected, retry with new short code
          console.log(
            `Collision detected for short code ${shortCode}, retrying... (attempt ${attempts}/${MAX_RETRIES})`
          );
          continue;
        }
        throw error;
      }
    }

    if (!success) {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Failed to generate unique short code after multiple attempts",
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        short_url: `https://shorturl.life/${shortCode}`,
        short_code: shortCode,
      }),
    };
  } catch (error) {
    console.error("Error:", error);
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

function isValidURL(url) {
  return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(url);
}
