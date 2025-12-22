import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: "ca-central-1" });

export const handler = async (event) => {
  console.log("Login request received:", JSON.stringify(event, null, 2));

  try {
    const body =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Missing required fields",
          message: "Email and password are required",
        }),
      };
    }

    // Authenticate the user
    const authCommand = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    let authResult;
    try {
      authResult = await client.send(authCommand);
      console.log("User authenticated successfully");
    } catch (error) {
      console.error("Authentication error:", error);

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
            error: "Invalid credentials",
            message: "Incorrect email or password",
          }),
        };
      }

      if (error.name === "UserNotConfirmedException") {
        return {
          statusCode: 403,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "Account not confirmed",
            message: "Please verify your email address before logging in",
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
            error: "Invalid credentials",
            message: "Incorrect email or password",
          }),
        };
      }

      if (error.name === "PasswordResetRequiredException") {
        return {
          statusCode: 403,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "Password reset required",
            message: "You must reset your password before logging in",
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
            message: "Too many failed login attempts. Please try again later",
          }),
        };
      }

      throw error;
    }

    // Decode the ID token to get user information
    const idToken = authResult.AuthenticationResult.IdToken;
    const tokenPayload = JSON.parse(
      Buffer.from(idToken.split('.')[1], 'base64').toString('utf-8')
    );

    // Return success with JWT tokens and user info
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Login successful",
        userId: tokenPayload.sub,
        email: tokenPayload.email,
        tokens: {
          idToken: authResult.AuthenticationResult.IdToken,
          accessToken: authResult.AuthenticationResult.AccessToken,
          refreshToken: authResult.AuthenticationResult.RefreshToken,
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
        message: "An unexpected error occurred during login",
      }),
    };
  }
};
