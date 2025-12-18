# URL Shortener - Terraform Architecture

## Overview

This document describes the AWS infrastructure architecture for the URL Shortener service, provisioned using Terraform.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet/Users                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS
                         │
                    ┌────▼────┐
                    │   API   │
                    │ Gateway │  (/shorten, /expand/{short})
                    │  (REST) │
                    └────┬────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
     POST /shorten                 GET /expand/{short}
          │                             │
    ┌─────▼──────┐              ┌──────▼─────┐
    │  Lambda    │              │  Lambda    │
    │  Shorten   │              │  Expand    │
    │    URL     │              │    URL     │
    └─────┬──────┘              └──────┬─────┘
          │                             │
          │  PutItem                    │  GetItem
          │                             │
          └──────────────┬──────────────┘
                         │
                    ┌────▼────┐
                    │ DynamoDB│
                    │  Table  │  (shortenurl-dev)
                    │         │  Key: ShortenedURL
                    └─────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    CloudWatch Logs                               │
│  - Lambda Logs (shorten, expand)                                │
│  - API Gateway Access Logs                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. API Gateway (REST API)

**Resource**: `aws_api_gateway_rest_api.url_shortener`

- **Type**: Regional REST API
- **Endpoints**:
  - `POST /shorten` - Shortens a long URL
  - `GET /expand/{short}` - Expands a short code to original URL
- **CORS**: Enabled for both endpoints
- **Stage**: `dev` (or environment name)
- **Logging**: CloudWatch access logs enabled

**Configuration**: [api_gateway.tf](dev/api_gateway.tf)

### 2. Lambda Functions

#### Shorten URL Lambda

**Resource**: `aws_lambda_function.shorten_url`

- **Function Name**: `url-shortener-dev-shorten-url`
- **Runtime**: Node.js 20.x
- **Handler**: `index.handler`
- **Memory**: 256 MB
- **Timeout**: 30 seconds
- **Source**: `lambda/shortenURL/`
- **Environment Variables**:
  - `DYNAMODB_TABLE_NAME`: `shortenurl-dev`
  - `AWS_REGION_CUSTOM`: `ca-central-1`
  - `ENVIRONMENT`: `dev`

**Purpose**: Generates a short hash for a long URL and stores mapping in DynamoDB.

#### Expand URL Lambda

**Resource**: `aws_lambda_function.expand_url`

- **Function Name**: `url-shortener-dev-expand-url`
- **Runtime**: Node.js 20.x
- **Handler**: `index.handler`
- **Memory**: 256 MB
- **Timeout**: 30 seconds
- **Source**: `lambda/expandURL/`
- **Environment Variables**:
  - `DYNAMODB_TABLE_NAME`: `shortenurl-dev`
  - `AWS_REGION_CUSTOM`: `ca-central-1`
  - `ENVIRONMENT`: `dev`

**Purpose**: Looks up the short code in DynamoDB and returns the original URL (302 redirect).

**Configuration**: [lambda.tf](dev/lambda.tf)

### 3. DynamoDB Table

**Resource**: `aws_dynamodb_table.url_mappings`

- **Table Name**: `shortenurl-dev`
- **Billing Mode**: PAY_PER_REQUEST (on-demand)
- **Primary Key**: `ShortenedURL` (String)
- **Attributes Stored**:
  - `ShortenedURL`: Short URL code (hash)
  - `OriginalURL`: Original long URL
  - `CreatedDate`: Date when mapping was created
- **Point-in-Time Recovery**: Enabled
- **Encryption**: AWS managed encryption at rest

**Configuration**: [dynamodb.tf](dev/dynamodb.tf)

### 4. IAM Roles & Policies

#### Lambda Execution Role

**Resource**: `aws_iam_role.lambda_execution_role`

- **Role Name**: `url-shortener-dev-lambda-role`
- **Trust Policy**: Allows Lambda service to assume role
- **Managed Policies Attached**:
  - `AWSLambdaBasicExecutionRole` (CloudWatch Logs)
- **Inline Policies**:
  - DynamoDB access policy (PutItem, GetItem, Query, Scan)

**Permissions Granted**:

```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:PutItem",
    "dynamodb:GetItem",
    "dynamodb:UpdateItem",
    "dynamodb:DeleteItem",
    "dynamodb:Query",
    "dynamodb:Scan"
  ],
  "Resource": [
    "arn:aws:dynamodb:ca-central-1:ACCOUNT_ID:table/shortenurl-dev",
    "arn:aws:dynamodb:ca-central-1:ACCOUNT_ID:table/shortenurl-dev/*"
  ]
}
```

**Configuration**: [iam.tf](dev/iam.tf)

### 5. CloudWatch Logs

Three log groups are created:

1. **Shorten Lambda Logs**: `/aws/lambda/url-shortener-dev-shorten-url`
2. **Expand Lambda Logs**: `/aws/lambda/url-shortener-dev-expand-url`
3. **API Gateway Logs**: `/aws/apigateway/url-shortener-dev`

**Retention**: 7 days (dev environment)

**Configuration**: [lambda.tf](dev/lambda.tf), [api_gateway.tf](dev/api_gateway.tf)

## Data Flow

### Shortening a URL (POST /shorten)

```
1. Client sends POST request to API Gateway
   POST https://xxx.execute-api.ca-central-1.amazonaws.com/dev/shorten
   Body: {"long_link": "https://example.com/long/url"}

2. API Gateway invokes Shorten Lambda function

3. Lambda validates URL format

4. Lambda generates 8-character hash using SHA-256

5. Lambda stores mapping in DynamoDB:
   {
     "ShortenedURL": "abc12345",
     "OriginalURL": "https://example.com/long/url",
     "CreatedDate": "2025-12-18"
   }

6. Lambda returns short URL: "https://shorturl.life/abc12345"

7. API Gateway returns response to client
```

### Expanding a URL (GET /expand/{short})

```
1. Client sends GET request to API Gateway
   GET https://xxx.execute-api.ca-central-1.amazonaws.com/dev/expand/abc12345

2. API Gateway invokes Expand Lambda function with path parameter

3. Lambda queries DynamoDB for ShortenedURL = "abc12345"

4. If found:
   - Lambda returns 302 redirect to OriginalURL
   - Browser automatically redirects to original URL

5. If not found:
   - Lambda returns 404 error with message "This URL is invalid."

6. API Gateway returns response to client
```

## Security Features

### Network Security

- API Gateway uses HTTPS/TLS encryption
- Regional endpoint (not public edge-optimized)
- CORS configured to allow cross-origin requests

### IAM Security

- **Principle of Least Privilege**: Lambda role has minimal permissions
- **No hardcoded credentials**: Uses IAM role for AWS SDK authentication
- **Separate roles**: Each service has its own role

### Data Security

- **Encryption at Rest**: DynamoDB uses AWS-managed encryption
- **Encryption in Transit**: All API calls use HTTPS
- **Point-in-Time Recovery**: Enabled for data backup

### Lambda Security

- **No public internet access needed**: Lambda uses VPC endpoints (optional)
- **Environment variables**: Used for configuration (not secrets)
- **Execution role**: Limited to specific DynamoDB table

## Scalability

### Auto-Scaling Components

1. **API Gateway**: Automatically scales to handle request load
2. **Lambda**: Concurrent executions scale automatically (default: 1000)
3. **DynamoDB**: On-demand billing scales read/write capacity automatically

### Performance Characteristics

- **API Gateway**: ~10ms latency
- **Lambda Cold Start**: ~1-3 seconds (first invocation)
- **Lambda Warm**: ~100-500ms
- **DynamoDB Query**: ~10-20ms

### Optimization Opportunities

1. **Provisioned Concurrency**: Eliminate Lambda cold starts
2. **DynamoDB Provisioned Capacity**: For predictable workloads
3. **CloudFront**: CDN for global distribution
4. **Lambda@Edge**: Run Lambda closer to users

## Cost Estimation (Dev Environment)

Based on moderate usage (1000 requests/day):

| Service | Usage | Cost/Month |
|---------|-------|------------|
| API Gateway | 30K requests | $0.10 |
| Lambda | 30K invocations, 256MB, 500ms avg | $0.02 |
| DynamoDB | On-demand, 30K writes, 30K reads | $0.50 |
| CloudWatch Logs | 1GB/month, 7-day retention | $0.50 |
| **Total** | | **~$1.12/month** |

*Production costs will be higher based on actual traffic*

## Disaster Recovery

### Backup Strategy

1. **Point-in-Time Recovery**: Enabled on DynamoDB
   - Continuous backups for 35 days
   - Restore to any point in time

2. **Terraform State**:
   - Store in S3 with versioning enabled
   - DynamoDB table for state locking

### Recovery Procedures

**Complete Infrastructure Loss**:
```bash
cd terraform/dev
terraform init
terraform apply
```

**Data Loss (DynamoDB)**:
```bash
# Restore from point-in-time
aws dynamodb restore-table-to-point-in-time \
  --source-table-name shortenurl-dev \
  --target-table-name shortenurl-dev-restored \
  --restore-date-time 2025-12-18T12:00:00Z
```

## Monitoring & Alerting

### Key Metrics to Monitor

1. **API Gateway**:
   - 4XX/5XX error rates
   - Request count
   - Latency (p50, p99)

2. **Lambda**:
   - Invocation count
   - Error count
   - Duration
   - Concurrent executions

3. **DynamoDB**:
   - Read/Write capacity
   - Throttled requests
   - System errors

### CloudWatch Dashboards

Create custom dashboards to monitor:
- API Gateway request rates
- Lambda execution metrics
- DynamoDB performance
- Cost tracking

### Recommended Alarms

```hcl
# API Gateway 5XX errors > 10 in 5 minutes
# Lambda errors > 5% of invocations
# DynamoDB throttled requests > 0
```

## Multi-Environment Strategy

### Dev Environment
- **Purpose**: Feature development and testing
- **Table**: `shortenurl-dev`
- **Log Retention**: 7 days
- **Cost**: Minimal (~$1-2/month)

### Production Environment
- **Purpose**: Live customer traffic
- **Table**: `shortenurl-prod`
- **Log Retention**: 30+ days
- **Enhancements**:
  - CloudFront distribution
  - WAF rules
  - Enhanced monitoring
  - Provisioned concurrency

### Separation Strategy

```
terraform/
├── dev/          # Development environment
└── prod/         # Production environment (copy of dev/ with different variables)
```

Each environment has:
- Separate AWS resources
- Separate Terraform state
- Separate API Gateway endpoints
- Separate DynamoDB tables

## Maintenance

### Regular Tasks

1. **Weekly**: Review CloudWatch logs for errors
2. **Monthly**: Review costs and optimize
3. **Quarterly**: Update Lambda runtime versions
4. **Yearly**: Rotate IAM credentials

### Updating Lambda Code

```bash
# Make code changes in lambda/ directory
cd terraform/dev
terraform apply  # Terraform detects changes and redeploys
```

### Updating Infrastructure

```bash
# Modify .tf files
terraform plan   # Review changes
terraform apply  # Apply changes
```

## Terraform Configuration Files

| File | Purpose | Resources |
|------|---------|-----------|
| `provider.tf` | AWS provider configuration | Provider, backend |
| `variables.tf` | Input variables | All configurable values |
| `dynamodb.tf` | DynamoDB table | Table, TTL, PITR |
| `iam.tf` | IAM roles and policies | Execution role, policies |
| `lambda.tf` | Lambda functions | Functions, log groups, permissions |
| `api_gateway.tf` | API Gateway | REST API, resources, methods, stage |
| `outputs.tf` | Output values | API URLs, ARNs |

## Best Practices Implemented

1. **Infrastructure as Code**: All resources defined in Terraform
2. **Environment Variables**: Configuration separated from code
3. **Least Privilege**: Minimal IAM permissions
4. **Encryption**: Data encrypted at rest and in transit
5. **Logging**: Comprehensive CloudWatch logging
6. **Tagging**: Consistent resource tagging
7. **Separation of Concerns**: Modular Terraform files
8. **Documentation**: Comprehensive README and guides

## Future Enhancements

1. **Custom Domain**: Route53 + ACM certificate
2. **CDN**: CloudFront distribution
3. **WAF**: Web Application Firewall rules
4. **Analytics**: Track URL usage statistics
5. **Rate Limiting**: API Gateway usage plans
6. **Caching**: API Gateway caching
7. **Monitoring**: Enhanced CloudWatch dashboards
8. **Alerting**: SNS notifications for errors

## References

- Terraform AWS Provider: https://registry.terraform.io/providers/hashicorp/aws/latest/docs
- AWS Lambda: https://docs.aws.amazon.com/lambda/
- API Gateway: https://docs.aws.amazon.com/apigateway/
- DynamoDB: https://docs.aws.amazon.com/dynamodb/
