import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({ region: "ca-central-1" });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  console.log("Feedback submission received:", JSON.stringify(event, null, 2));

  try {
    const body =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    const { rating, feedback, email } = body;

    // Validate input
    if (!feedback || feedback.trim().length === 0) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Missing required fields",
          message: "Feedback text is required",
        }),
      };
    }

    // Validate feedback length
    if (feedback.length > 5000) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Feedback too long",
          message: "Feedback must be less than 5000 characters",
        }),
      };
    }

    // Validate rating if provided
    if (rating !== undefined && rating !== null) {
      if (typeof rating !== "number" || rating < 1 || rating > 5) {
        return {
          statusCode: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "Invalid rating",
            message: "Rating must be a number between 1 and 5",
          }),
        };
      }
    }

    // Validate email if provided
    if (email && email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          statusCode: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "Invalid email format",
            message: "Please provide a valid email address",
          }),
        };
      }
    }

    // Generate unique feedback ID and timestamp
    const feedbackId = randomUUID();
    const timestamp = Date.now();

    // Prepare feedback item
    const feedbackItem = {
      FeedbackId: feedbackId,
      CreatedAt: timestamp,
      Feedback: feedback.trim(),
      Rating: rating || null,
      Email: email && email.trim().length > 0 ? email.trim() : null,
      UserAgent: event.headers?.["User-Agent"] || null,
      SourceIP: event.requestContext?.identity?.sourceIp || null,
    };

    // Save to DynamoDB
    const command = new PutCommand({
      TableName: process.env.FEEDBACK_TABLE_NAME,
      Item: feedbackItem,
    });

    await docClient.send(command);

    console.log("Feedback saved successfully:", feedbackId);

    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Thank you for your feedback!",
        feedbackId: feedbackId,
      }),
    };
  } catch (error) {
    console.error("Error saving feedback:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred while submitting feedback",
      }),
    };
  }
};
