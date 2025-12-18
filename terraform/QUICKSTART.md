# Terraform Quick Start Guide

This guide will help you deploy the URL Shortener service to AWS using Terraform.

## Prerequisites

1. AWS CLI installed and configured
2. Terraform 1.0+ installed
3. Node.js and npm installed

## Deploy to Dev Environment

### Step 1: Install Lambda Dependencies

```bash
# From project root
cd lambda/shortenURL
npm install

cd ../expandURL
npm install
```

### Step 2: Initialize Terraform

```bash
cd ../../terraform/dev
terraform init
```

### Step 3: Review and Deploy

```bash
# Preview changes
terraform plan

# Deploy infrastructure
terraform apply
```

Type `yes` when prompted.

### Step 4: Get Your API Endpoints

```bash
terraform output api_endpoints
```

## Test Your Deployment

```bash
# Get the API Gateway URL
API_URL=$(terraform output -raw api_gateway_url)

# Shorten a URL
curl -X POST "$API_URL/shorten" \
  -H "Content-Type: application/json" \
  -d '{"long_link": "https://www.example.com/test"}'

# Expand a URL (replace 'abc12345' with actual short code)
curl "$API_URL/expand/abc12345"
```

## View Logs

```bash
# Lambda logs
aws logs tail /aws/lambda/url-shortener-dev-shorten-url --follow

# API Gateway logs
aws logs tail /aws/apigateway/url-shortener-dev --follow
```

## Update Lambda Code

After making changes to Lambda functions:

```bash
cd terraform/dev
terraform apply
```

Terraform will automatically detect code changes and update the functions.

## Clean Up

To delete all resources:

```bash
cd terraform/dev
terraform destroy
```

Type `yes` when prompted.

## What Gets Created

- **DynamoDB Table**: `shortenurl-dev`
- **Lambda Functions**:
  - `url-shortener-dev-shorten-url`
  - `url-shortener-dev-expand-url`
- **API Gateway**: REST API with `/shorten` and `/expand/{short}` endpoints
- **IAM Roles**: Lambda execution role with DynamoDB permissions
- **CloudWatch Logs**: For monitoring and debugging

## Project Structure

```
terraform/
├── QUICKSTART.md                    # This file
├── dev/                             # Development environment
│   ├── provider.tf                  # AWS provider configuration
│   ├── variables.tf                 # Input variables
│   ├── dynamodb.tf                  # DynamoDB table
│   ├── iam.tf                       # IAM roles and policies
│   ├── lambda.tf                    # Lambda functions
│   ├── api_gateway.tf               # API Gateway
│   ├── outputs.tf                   # Output values
│   ├── .gitignore                   # Git ignore rules
│   ├── terraform.tfvars.example     # Example variables
│   ├── README.md                    # Detailed documentation
│   └── LAMBDA_ENV_VARS.md           # Lambda env vars guide
└── prod/                            # Production environment (future)
```

## Environment Variables

Lambda functions receive these environment variables:

- `DYNAMODB_TABLE_NAME`: DynamoDB table name
- `AWS_REGION_CUSTOM`: AWS region
- `ENVIRONMENT`: Environment name (dev/prod)

See [dev/LAMBDA_ENV_VARS.md](dev/LAMBDA_ENV_VARS.md) for details on updating Lambda code to use these variables.

## Next Steps

1. **Review the Configuration**: Check [dev/README.md](dev/README.md) for detailed documentation
2. **Customize Settings**: Copy `terraform.tfvars.example` to `terraform.tfvars` and modify as needed
3. **Set Up Remote State**: Configure S3 backend for team collaboration (see dev/README.md)
4. **Create Production Environment**: Copy `dev/` to `prod/` and update variables

## Troubleshooting

### Lambda Packaging Issues

If Lambda functions fail to deploy:
```bash
# Ensure dependencies are installed
cd lambda/shortenURL && npm install
cd ../expandURL && npm install
```

### Permission Errors

Ensure your AWS credentials have permissions to create:
- DynamoDB tables
- Lambda functions
- API Gateway
- IAM roles
- CloudWatch log groups

### State Lock Issues

If Terraform state is locked:
```bash
terraform force-unlock <LOCK_ID>
```

## Support

For detailed documentation, see:
- [Dev Environment README](dev/README.md)
- [Lambda Environment Variables Guide](dev/LAMBDA_ENV_VARS.md)
