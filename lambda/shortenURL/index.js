import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { generateSecureShortCode } from "./shared/shortCodeGenerator.js";
import { getUserIdFromEvent } from "./shared/authHelper.js";

const client = new DynamoDBClient({ region: "ca-central-1" });
const dynamodb = DynamoDBDocumentClient.from(client);

const MAX_RETRIES = 5;

/**
 * Check if a logged-in user already has a short code for the given URL
 * @param {string} userId - The user ID
 * @param {string} originalURL - The original URL to check
 * @returns {Promise<string|null>} - The existing short code or null if not found
 */
async function checkExistingShortCode(userId, originalURL) {
  if (userId === "anonymous") {
    return null; // Don't deduplicate for anonymous users
  }

  try {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: process.env.TABLE_NAME,
        IndexName: "UserIdOriginalURLIndex",
        KeyConditionExpression: "UserId = :userId AND OriginalURL = :url",
        ExpressionAttributeValues: {
          ":userId": userId,
          ":url": originalURL,
        },
        Limit: 1, // We only need to know if one exists
      })
    );

    if (result.Items && result.Items.length > 0) {
      return result.Items[0].ShortCode;
    }

    return null;
  } catch (error) {
    console.error("Error checking for existing short code:", error);
    // On error, return null to proceed with creating a new short code
    return null;
  }
}

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

    // For logged-in users, check if they already have a short code for this URL
    const existingShortCode = await checkExistingShortCode(userId, long_link);
    if (existingShortCode) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(`https://shorturl.life/${existingShortCode}`),
      };
    }

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
      body: JSON.stringify(`https://shorturl.life/${shortCode}`),
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
