# Lambda Environment Variables Configuration

## Overview

Terraform automatically injects environment variables into your Lambda functions. This document explains how to use them in your Lambda code.

## Environment Variables Provided

When deployed via Terraform, each Lambda function receives these environment variables:

| Variable Name | Description | Example Value |
|--------------|-------------|---------------|
| `DYNAMODB_TABLE_NAME` | DynamoDB table name | `shortenurl-dev` |
| `AWS_REGION_CUSTOM` | AWS region for resources | `ca-central-1` |
| `ENVIRONMENT` | Environment name | `dev` |

## Configuration in Terraform

These variables are configured in [lambda.tf](lambda.tf):

```hcl
resource "aws_lambda_function" "shorten_url" {
  # ... other configuration ...

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.url_mappings.name
      AWS_REGION_CUSTOM   = var.aws_region
      ENVIRONMENT         = var.environment
    }
  }
}
```

## Using Environment Variables in Lambda Code

### Current Lambda Code (Hardcoded)

Your current Lambda functions have hardcoded values:

**shortenURL/index.js (Lines 2-3):**
```javascript
import AWS from "aws-sdk";
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: "ca-central-1" });
```

**shortenURL/index.js (Line 48):**
```javascript
const params = {
  TableName: "URLMappings",
  // ...
};
```

### Updated Lambda Code (Using Environment Variables)

To make your Lambda functions work with Terraform-provided environment variables, update the code as follows:

#### Option 1: Update shortenURL/index.js

```javascript
import AWS from "aws-sdk";

// Use environment variables instead of hardcoded values
const region = process.env.AWS_REGION_CUSTOM || "ca-central-1";
const tableName = process.env.DYNAMODB_TABLE_NAME || "URLMappings";

const dynamodb = new AWS.DynamoDB.DocumentClient({ region });

export const handler = async (event) => {
  const long_link = event.long_link;

  if (!isValidURL(long_link)) {
    return "Please enter a valid long URL to shorten it";
  }

  const short_link = generateShortLink(long_link);

  const success = await storeShortAndLongLinks(short_link, long_link);
  if (success) {
    return "https://shorturl.life/" + short_link;
  } else {
    return false;
  }
};

function isValidURL(url) {
  const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  return urlPattern.test(url);
}

function generateShortLink(long_link) {
  const hash = hashString(long_link);
  return hash;
}

function hashString(input) {
  const hash = crypto.createHash("sha256");
  hash.update(input);
  return hash.digest("hex").slice(0, 8);
}

async function storeShortAndLongLinks(short_link, long_link) {
  const currentDate = new Date().toISOString().split("T")[0];

  try {
    const params = {
      TableName: tableName,  // Use environment variable
      Item: {
        ShortenedURL: short_link,
        OriginalURL: long_link,
        CreatedDate: currentDate,
      },
    };

    await dynamodb.put(params).promise();
    return true;
  } catch (error) {
    console.error("Error storing in DynamoDB:", error);
    return false;
  }
}
```

#### Option 2: Update expandURL/index.js

```javascript
const AWS = require("aws-sdk");

// Use environment variables instead of hardcoded values
const region = process.env.AWS_REGION_CUSTOM || "ca-central-1";
const tableName = process.env.DYNAMODB_TABLE_NAME || "URLMappings";

const dynamodb = new AWS.DynamoDB.DocumentClient({ region });

exports.handler = async (event) => {
  try {
    // Extract the shortened URL from the path parameters
    const { url } = event.pathParameters;

    // Define the DynamoDB parameters to retrieve the long URL
    const params = {
      TableName: tableName,  // Use environment variable
      Key: {
        ShortenedURL: url,
      },
    };

    const data = await dynamodb.get(params).promise();

    if (data.Item && data.Item.OriginalURL) {
      return {
        statusCode: 302,
        headers: {
          Location: data.Item.OriginalURL,
        },
      };
    }

    return {
      statusCode: 404,
      body: "This URL is invalid.",
    };
  } catch (error) {
    console.error("Error expanding URL:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
```

## Benefits of Using Environment Variables

1. **Environment Separation**: Different table names for dev/prod without code changes
2. **Configuration Management**: Change settings via Terraform without modifying code
3. **Security**: Sensitive values can be managed externally
4. **Flexibility**: Easy to test with different configurations
5. **Best Practice**: Follows 12-factor app methodology

## Testing Environment Variables Locally

To test your Lambda functions locally with environment variables:

```bash
# Set environment variables
export DYNAMODB_TABLE_NAME=shortenurl-dev
export AWS_REGION_CUSTOM=ca-central-1
export ENVIRONMENT=dev

# Run your local tests
node test-lambda.js
```

## Debugging

### Check Lambda Environment Variables in AWS Console

1. Go to AWS Lambda Console
2. Select your Lambda function
3. Click on "Configuration" tab
4. Click on "Environment variables"
5. Verify the variables are set correctly

### Check Environment Variables in CloudWatch Logs

Add logging to your Lambda function:

```javascript
console.log("Environment Variables:");
console.log("DYNAMODB_TABLE_NAME:", process.env.DYNAMODB_TABLE_NAME);
console.log("AWS_REGION_CUSTOM:", process.env.AWS_REGION_CUSTOM);
console.log("ENVIRONMENT:", process.env.ENVIRONMENT);
```

View the logs in CloudWatch:

```bash
aws logs tail /aws/lambda/url-shortener-dev-shorten-url --follow
```

## Adding New Environment Variables

To add new environment variables:

1. Update [lambda.tf](lambda.tf):

```hcl
environment {
  variables = {
    DYNAMODB_TABLE_NAME = aws_dynamodb_table.url_mappings.name
    AWS_REGION_CUSTOM   = var.aws_region
    ENVIRONMENT         = var.environment
    NEW_VARIABLE        = "new-value"  # Add new variable here
  }
}
```

2. Apply the changes:

```bash
terraform apply
```

3. Use in Lambda code:

```javascript
const newValue = process.env.NEW_VARIABLE;
```

## Environment-Specific Configuration

You can use the `ENVIRONMENT` variable to enable different behaviors:

```javascript
const environment = process.env.ENVIRONMENT;

if (environment === "dev") {
  console.log("Running in development mode");
  // Enable verbose logging, test features, etc.
} else if (environment === "prod") {
  console.log("Running in production mode");
  // Minimize logging, production optimizations
}
```

## Security Considerations

1. **Don't hardcode secrets**: Use AWS Secrets Manager or Parameter Store for sensitive data
2. **Use IAM roles**: Let Lambda execution role provide AWS credentials
3. **Least privilege**: Grant only necessary permissions in IAM policies
4. **Encryption**: Enable encryption for environment variables containing sensitive data

## Example: Using AWS Secrets Manager

For sensitive configuration:

```javascript
const AWS = require("aws-sdk");
const secretsManager = new AWS.SecretsManager();

async function getSecret(secretName) {
  const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
  return JSON.parse(data.SecretString);
}

// Use in your handler
const apiKey = await getSecret("url-shortener-api-key");
```

## Summary

Using environment variables makes your Lambda functions:
- More flexible and configurable
- Easier to deploy across multiple environments
- Secure by separating configuration from code
- Compliant with cloud-native best practices

The Terraform configuration automatically manages these variables, ensuring consistency across your infrastructure.
