import crypto from "crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ca-central-1" });
const dynamodb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    const body =
      typeof event.body === "string" ? JSON.parse(event.body) : event;

    const long_link = body.long_link;

    if (!isValidURL(long_link)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid URL" }),
      };
    }

    const short_link = generateShortLink(long_link);

    await dynamodb.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          ShortenedURL: short_link,
          OriginalURL: long_link,
          CreatedDate: new Date().toISOString(),
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        short_url: `https://shorturl.life/${short_link}`,
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

function isValidURL(url) {
  return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(url);
}

function generateShortLink(input) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 8);
}
