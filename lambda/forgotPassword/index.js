import {
  CognitoIdentityProviderClient,
  ForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
// testing

const client = new CognitoIdentityProviderClient({ region: "ca-central-1" });

export const handler = async (event) => {
  console.log(
    "Forgot password request received:",
    JSON.stringify(event, null, 2)
  );

  try {
    const body =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    const { email } = body;

    // Validate input
    if (!email) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Missing required field",
          message: "Email is required",
        }),
      };
    }

    // Validate email format
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

    // Initiate forgot password flow
    const command = new ForgotPasswordCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
    });

    try {
      const result = await client.send(command);
      console.log("Forgot password initiated successfully:", result);

      // Return success - don't reveal if user exists for security
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message:
            "If an account with that email exists, a password reset code has been sent.",
          codeDeliveryDetails: result.CodeDeliveryDetails,
        }),
      };
    } catch (error) {
      console.error("Forgot password error:", error);

      // For security, don't reveal if user doesn't exist
      // Return success message anyway
      if (error.name === "UserNotFoundException") {
        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message:
              "If an account with that email exists, a password reset code has been sent.",
          }),
        };
      }

      if (error.name === "LimitExceededException") {
        return {
          statusCode: 429,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "Too many requests",
            message:
              "Please wait before requesting another password reset code",
          }),
        };
      }

      if (error.name === "InvalidParameterException") {
        return {
          statusCode: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "Invalid parameters",
            message: error.message || "Invalid request parameters",
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
