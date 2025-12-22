import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
// testing
const client = new CognitoIdentityProviderClient({ region: "ca-central-1" });

export const handler = async (event) => {
  console.log(
    "Reset password request received:",
    JSON.stringify(event, null, 2)
  );

  try {
    const body =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    const { email, code, newPassword } = body;

    // Validate input
    if (!email || !code || !newPassword) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Missing required fields",
          message: "Email, verification code, and new password are required",
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

    // Validate password strength
    if (newPassword.length < 8) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Weak password",
          message:
            "Password must be at least 8 characters and contain uppercase, lowercase, numbers, and symbols",
        }),
      };
    }

    // Confirm forgot password with the verification code
    const command = new ConfirmForgotPasswordCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    });

    try {
      const result = await client.send(command);
      console.log("Password reset successfully:", result);

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message:
            "Password reset successfully. You can now log in with your new password.",
        }),
      };
    } catch (error) {
      console.error("Reset password error:", error);

      if (error.name === "CodeMismatchException") {
        return {
          statusCode: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "Invalid verification code",
            message:
              "The verification code is incorrect. Please check and try again.",
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
            error: "Expired verification code",
            message:
              "The verification code has expired. Please request a new one.",
          }),
        };
      }

      if (error.name === "InvalidPasswordException") {
        return {
          statusCode: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "Invalid password",
            message: error.message || "Password does not meet requirements",
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
            message: "No account found with this email address",
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
            error: "Too many attempts",
            message: "Too many failed attempts. Please try again later.",
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
