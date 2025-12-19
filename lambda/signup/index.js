import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: "ca-central-1" });

export const handler = async (event) => {
  console.log("Signup request received:", JSON.stringify(event, null, 2));

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
    if (password.length < 8) {
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

    // Step 1: Sign up the user
    const signUpCommand = new SignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
      ],
    });

    let signUpResult;
    try {
      signUpResult = await client.send(signUpCommand);
      console.log("User signed up successfully:", signUpResult.UserSub);
    } catch (error) {
      console.error("Signup error:", error);

      // Handle specific Cognito errors
      if (error.name === "UsernameExistsException") {
        return {
          statusCode: 409,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "User already exists",
            message: "An account with this email already exists",
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
            message: error.message || "Invalid signup parameters",
          }),
        };
      }

      throw error;
    }

    // Step 2: Auto-confirm the user (skip email verification)
    const confirmCommand = new AdminConfirmSignUpCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: email,
    });

    try {
      await client.send(confirmCommand);
      console.log("User auto-confirmed successfully");
    } catch (error) {
      console.error("Auto-confirm error:", error);
      // Continue even if auto-confirm fails - user might need to verify email manually
    }

    // Step 3: Automatically log the user in to get tokens
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
      console.log("User authenticated successfully after signup");
    } catch (error) {
      console.error("Auto-login error:", error);

      // If auto-login fails, still return success for signup
      return {
        statusCode: 201,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Account created successfully. Please log in.",
          userId: signUpResult.UserSub,
          email: email,
        }),
      };
    }

    // Return success with JWT tokens
    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Account created successfully",
        userId: signUpResult.UserSub,
        email: email,
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
        message: "An unexpected error occurred during signup",
      }),
    };
  }
};
