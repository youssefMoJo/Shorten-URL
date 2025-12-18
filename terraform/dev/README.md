# URL Shortener - Dev Environment Terraform Configuration

This directory contains Terraform configuration for deploying the URL Shortener service in a **development environment**.

## Architecture Overview

This Terraform setup provisions:

1. **DynamoDB Table** (`shortenurl-dev`) - Stores URL mappings with ShortenedURL as the primary key
2. **Lambda Functions**:
   - `url-shortener-dev-shorten-url` - Shortens long URLs
   - `url-shortener-dev-expand-url` - Expands shortened URLs back to original
3. **API Gateway** - REST API with two endpoints:
   - `POST /shorten` - Shortens a URL
   - `GET /expand/{short}` - Expands a shortened URL
4. **IAM Roles & Policies** - Grants Lambda functions access to DynamoDB and CloudWatch
5. **CloudWatch Log Groups** - For Lambda and API Gateway logging

## Project Structure

```
terraform/dev/
├── provider.tf          # AWS provider and Terraform configuration
├── variables.tf         # Input variables for configuration
├── dynamodb.tf          # DynamoDB table for URL mappings
├── iam.tf              # IAM roles and policies for Lambda
├── lambda.tf           # Lambda functions (shorten and expand)
├── api_gateway.tf      # API Gateway configuration with endpoints
├── outputs.tf          # Output values (API URLs, resource ARNs, etc.)
├── README.md           # This file
└── lambda_packages/    # Auto-generated directory for Lambda deployment packages
```

## Prerequisites

1. **AWS CLI** - Installed and configured with appropriate credentials
   ```bash
   aws configure
   ```

2. **Terraform** - Version 1.0 or higher
   ```bash
   terraform --version
   ```

3. **Lambda Dependencies** - Install Node.js dependencies for Lambda functions
   ```bash
   cd ../../lambda/shortenURL
   npm install

   cd ../expandURL
   npm install
   ```

## Configuration

### Environment Variables

The key configuration variables are defined in [variables.tf](variables.tf):

| Variable | Default | Description |
|----------|---------|-------------|
| `environment` | `dev` | Environment name |
| `aws_region` | `ca-central-1` | AWS region for deployment |
| `dynamodb_table_name` | `shortenurl-dev` | DynamoDB table name |
| `lambda_runtime` | `nodejs20.x` | Node.js runtime version |
| `lambda_timeout` | `30` | Lambda timeout in seconds |
| `lambda_memory_size` | `256` | Lambda memory in MB |

### Lambda Environment Variables

The Lambda functions receive these environment variables automatically:

```hcl
environment {
  variables = {
    DYNAMODB_TABLE_NAME = "shortenurl-dev"      # DynamoDB table name
    AWS_REGION_CUSTOM   = "ca-central-1"        # AWS region
    ENVIRONMENT         = "dev"                  # Environment identifier
  }
}
```

To use these in your Lambda code:
```javascript
const tableName = process.env.DYNAMODB_TABLE_NAME;
const region = process.env.AWS_REGION_CUSTOM;
const environment = process.env.ENVIRONMENT;
```

## Deployment Steps

### 1. Initialize Terraform

Navigate to this directory and initialize Terraform:

```bash
cd terraform/dev
terraform init
```

This will:
- Download required provider plugins (AWS, Archive)
- Initialize the backend configuration
- Prepare your working directory

### 2. Review the Plan

Preview the changes Terraform will make:

```bash
terraform plan
```

Review the output to ensure all resources are configured correctly.

### 3. Apply the Configuration

Deploy the infrastructure:

```bash
terraform apply
```

Type `yes` when prompted to confirm the deployment.

### 4. Get the API Endpoints

After successful deployment, Terraform will output important values:

```bash
terraform output
```

Example output:
```
api_endpoints = {
  "expand" = "https://abc123xyz.execute-api.ca-central-1.amazonaws.com/dev/expand/{short}"
  "shorten" = "https://abc123xyz.execute-api.ca-central-1.amazonaws.com/dev/shorten"
}
api_gateway_url = "https://abc123xyz.execute-api.ca-central-1.amazonaws.com/dev"
dynamodb_table_name = "shortenurl-dev"
```

## Testing the API

### Shorten a URL

```bash
curl -X POST https://YOUR_API_GATEWAY_URL/dev/shorten \
  -H "Content-Type: application/json" \
  -d '{"long_link": "https://www.example.com/very/long/url"}'
```

Expected response:
```
https://shorturl.life/abc12345
```

### Expand a URL

```bash
curl https://YOUR_API_GATEWAY_URL/dev/expand/abc12345
```

The API will return a 302 redirect to the original URL.

## Monitoring and Logs

### CloudWatch Logs

View Lambda function logs:
```bash
# Shorten Lambda logs
aws logs tail /aws/lambda/url-shortener-dev-shorten-url --follow

# Expand Lambda logs
aws logs tail /aws/lambda/url-shortener-dev-expand-url --follow

# API Gateway logs
aws logs tail /aws/apigateway/url-shortener-dev --follow
```

### API Gateway Metrics

Monitor API Gateway metrics in CloudWatch:
- Request count
- Latency (4XX, 5XX errors)
- Integration latency

## Updating Lambda Functions

When you update Lambda function code:

1. Modify the code in `lambda/shortenURL/` or `lambda/expandURL/`
2. Run `terraform apply` to redeploy:

```bash
terraform apply
```

Terraform will automatically:
- Detect code changes via SHA256 hash
- Repackage the Lambda functions
- Update the Lambda functions in AWS

## Destroying the Infrastructure

To tear down all resources in the dev environment:

```bash
terraform destroy
```

Type `yes` when prompted. This will delete:
- API Gateway
- Lambda functions
- DynamoDB table (⚠️ **This will delete all data**)
- IAM roles and policies
- CloudWatch log groups

## State Management

### Local State (Default)

By default, Terraform stores state locally in `terraform.tfstate`. This is suitable for individual development but not recommended for teams.

### Remote State (Recommended for Teams)

For team collaboration, use S3 backend for state storage:

1. Create an S3 bucket and DynamoDB table:
```bash
aws s3 mb s3://your-terraform-state-bucket
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

2. Uncomment the backend configuration in [provider.tf](provider.tf):
```hcl
backend "s3" {
  bucket         = "your-terraform-state-bucket"
  key            = "url-shortener/dev/terraform.tfstate"
  region         = "ca-central-1"
  dynamodb_table = "terraform-state-lock"
  encrypt        = true
}
```

3. Re-initialize Terraform:
```bash
terraform init -migrate-state
```

## Customization

### Change the Region

Edit [variables.tf](variables.tf) or override via command line:

```bash
terraform apply -var="aws_region=us-east-1"
```

### Change Lambda Memory/Timeout

Override in [variables.tf](variables.tf) or via command line:

```bash
terraform apply \
  -var="lambda_memory_size=512" \
  -var="lambda_timeout=60"
```

### Add Custom Tags

Modify the `tags` variable in [variables.tf](variables.tf):

```hcl
variable "tags" {
  default = {
    Project     = "url-shortener"
    Environment = "dev"
    ManagedBy   = "terraform"
    Team        = "your-team"
    CostCenter  = "engineering"
  }
}
```

## Troubleshooting

### Lambda Function Not Found

Ensure Lambda dependencies are installed:
```bash
cd ../../lambda/shortenURL && npm install
cd ../expandURL && npm install
```

### API Gateway 403 Forbidden

Check that Lambda permissions are correctly configured in [lambda.tf](lambda.tf).

### DynamoDB Access Denied

Verify IAM policies in [iam.tf](iam.tf) grant necessary permissions.

### State Lock Issues

If using S3 backend and getting lock errors:
```bash
# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

## Dev vs Production

This is the **dev environment** configuration. Key differences from production:

| Feature | Dev | Production |
|---------|-----|------------|
| Environment Name | `dev` | `prod` |
| DynamoDB Table | `shortenurl-dev` | `shortenurl-prod` |
| Log Retention | 7 days | 30+ days |
| Billing Mode | Pay-per-request | Provisioned (for predictable traffic) |
| Point-in-time Recovery | Enabled | Enabled |
| CloudWatch Detailed Logging | Enabled | Enabled |

To create a production environment:
1. Copy `terraform/dev/` to `terraform/prod/`
2. Update variables in `terraform/prod/variables.tf`
3. Update backend state path in `provider.tf`
4. Deploy separately with `cd terraform/prod && terraform apply`

## Additional Resources

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)

## Support

For issues or questions:
1. Check CloudWatch logs for error messages
2. Review Terraform plan output for configuration issues
3. Verify AWS credentials and permissions
