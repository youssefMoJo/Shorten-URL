import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: "ca-central-1" });

export const handler = async (event) => {
  console.log("Verify email request received:", JSON.stringify(event, null, 2));

  try {
    const body =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    const { email, code } = body;

    // Validate input
    if (!email || !code) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Missing required fields",
          message: "Email and verification code are required",
        }),
      };
    }

    // Confirm signup with verification code
    const command = new ConfirmSignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
    });

    try {
      await client.send(command);
      console.log("Email verified successfully");

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Email verified successfully. You can now log in.",
        }),
      };
    } catch (error) {
      console.error("Verification error:", error);

      if (error.name === "CodeMismatchException") {
        return {
          statusCode: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "Invalid code",
            message: "The verification code is incorrect",
          }),
        };
      }

      if (error.name === "ExpiredCodeException") {
        return {
          statusCode: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "Code expired",
            message: "The verification code has expired. Please request a new one.",
          }),
        };
      }

      if (error.name === "NotAuthorizedException") {
        return {
          statusCode: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "Already verified",
            message: "This account is already verified",
          }),
        };
      }

      if (error.name === "UserNotFoundException") {
        return {
          statusCode: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "User not found",
            message: "No account found with this email",
          }),
        };
      }

      throw error;
    }
  } catch (error) {
    console.error("Unexpected error:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred. Please try again later.",
      }),
    };
  }
};
