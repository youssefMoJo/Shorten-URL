import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: "ca-central-1" });

export const handler = async (event) => {
  console.log("Token refresh request received:", JSON.stringify(event, null, 2));

  try {
    const body =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    const { refreshToken } = body;

    // Validate input
    if (!refreshToken) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Missing required fields",
          message: "Refresh token is required",
        }),
      };
    }

    // Refresh the tokens using the refresh token
    const authCommand = new InitiateAuthCommand({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    let authResult;
    try {
      authResult = await client.send(authCommand);
      console.log("Token refreshed successfully");
    } catch (error) {
      console.error("Token refresh error:", error);

      // Handle specific Cognito errors
      if (error.name === "NotAuthorizedException") {
        return {
          statusCode: 401,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "Invalid refresh token",
            message: "The refresh token is invalid or expired",
          }),
        };
      }

      if (error.name === "UserNotFoundException") {
        return {
          statusCode: 401,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "User not found",
            message: "The user associated with this token was not found",
          }),
        };
      }

      if (error.name === "TooManyRequestsException") {
        return {
          statusCode: 429,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "Too many attempts",
            message: "Too many refresh attempts. Please try again later",
          }),
        };
      }

      throw error;
    }

    // Return success with new tokens
    // Note: REFRESH_TOKEN_AUTH returns new idToken and accessToken, but NOT a new refreshToken
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Token refreshed successfully",
        tokens: {
          idToken: authResult.AuthenticationResult.IdToken,
          accessToken: authResult.AuthenticationResult.AccessToken,
          expiresIn: authResult.AuthenticationResult.ExpiresIn,
        },
      }),
    };
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
        message: "An unexpected error occurred during token refresh",
      }),
    };
  }
};
