# Production Terraform Configuration

This directory contains the Terraform configuration for the production environment of the URL Shortener application.

## Key Differences from Dev

- **Environment**: `prod`
- **DynamoDB Table**: `shortenurl-prod`
- **Lambda Memory**: 512 MB (vs 256 MB in dev)
- **Cognito Deletion Protection**: ACTIVE
- **Tags**: Environment set to `prod`

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.0 installed
3. AWS profile: `AWS youssefrafaat67`

## Deployment Steps

### Initial Setup

```bash
cd terraform/prod

# Initialize Terraform
terraform init

# Review the planned changes
terraform plan

# Apply the configuration
terraform apply
```

### Updating Infrastructure

```bash
cd terraform/prod

# Review changes
terraform plan

# Apply updates
terraform apply
```

## Important Production Considerations

### 1. State Management
Consider using S3 backend for state management in production. Uncomment and configure the backend block in [provider.tf](provider.tf):

```hcl
backend "s3" {
  bucket         = "your-terraform-state-bucket"
  key            = "url-shortener/prod/terraform.tfstate"
  region         = "ca-central-1"
  dynamodb_table = "terraform-state-lock"
  encrypt        = true
}
```

### 2. Security Enhancements
- MFA is currently OFF in Cognito. Consider enabling it for production
- Review Cognito callback URLs and update them with your production domain
- Consider enabling DynamoDB encryption at rest
- Review IAM policies for least privilege access

### 3. Monitoring and Alerts
Consider adding:
- CloudWatch alarms for Lambda errors and throttling
- DynamoDB capacity alarms
- API Gateway 4xx/5xx error alarms
- Cost alerts

### 4. Backup and Recovery
- Point-in-time recovery is ENABLED for DynamoDB tables
- Consider setting up automated backups for critical data
- Test disaster recovery procedures

## Resource Overview

The production environment creates:
- **DynamoDB Tables**:
  - `shortenurl-prod` (URL mappings)
  - `Shorten-URL-prod-feedback` (User feedback)
- **Lambda Functions**:
  - shortenURL
  - expandURL
  - getUserLinks
  - deleteLink
  - feedback
- **Cognito User Pool**: For authentication
- **API Gateway**: REST API endpoints
- **IAM Roles**: For Lambda execution

## Outputs

After deployment, Terraform will output:
- API Gateway URL
- Cognito User Pool ID
- Cognito Client ID
- DynamoDB table names

## Destroying Resources

To tear down the production environment:

```bash
terraform destroy
```

**WARNING**: This will delete all production data. Make sure you have backups before proceeding.

## Troubleshooting

### Lambda Package Issues
If Lambda functions fail to update, ensure the package files are built correctly:
```bash
ls -lh lambda_packages/
```

### State Lock Issues
If you encounter state lock errors, check the DynamoDB lock table or use:
```bash
terraform force-unlock <lock-id>
```

## Support

For issues or questions, refer to the main project documentation or contact the development team.
