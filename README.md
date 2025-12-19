# URL Shortener with User Authentication

A production-ready serverless URL shortener built on AWS with Cognito authentication, supporting both anonymous and authenticated users.

## Features

- **Anonymous URL Shortening**: Anyone can create short links
- **User Authentication**: Sign up/login with Cognito
- **User Dashboard**: Authenticated users can view all their links
- **Secure Short Codes**: Cryptographically random 8-character codes
- **Collision Handling**: Automatic retry with conditional writes
- **Scalable Architecture**: DynamoDB GSI for efficient user queries
- **Infrastructure as Code**: Terraform for reproducible deployments
- **CORS Enabled**: Ready for web frontend integration

## Architecture

Built with AWS serverless services:

- **Amazon Cognito**: User pools for authentication
- **API Gateway**: REST API with Cognito authorizer
- **AWS Lambda**: Three Node.js functions (ES modules)
- **DynamoDB**: Single table with GSI
- **CloudWatch**: Logging and monitoring

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed design and scaling considerations.

## Quick Start

### Prerequisites

- AWS Account
- AWS CLI configured
- Terraform >= 1.0
- Node.js >= 18

### Deploy to AWS

```bash
# 1. Install Lambda dependencies
cd lambda/shortenURL && npm install && cd ../..
cd lambda/expandURL && npm install && cd ../..
cd lambda/getUserLinks && npm install && cd ../..

# 2. Deploy with Terraform
cd terraform/dev
terraform init
terraform plan
terraform apply

# 3. Get API endpoint
terraform output api_gateway_url
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.

## API Endpoints

### POST /shorten (Public)

Create a shortened URL.

```bash
curl -X POST "https://your-api-url/dev/shorten" \
  -H "Content-Type: application/json" \
  -d '{"long_link": "https://www.example.com/very/long/url"}'
```

**Response:**
```json
{
  "short_url": "https://shorturl.life/aBcD1234",
  "short_code": "aBcD1234"
}
```

### GET /expand/{short} (Public)

Redirect to original URL.

```bash
curl -i "https://your-api-url/dev/expand/aBcD1234"
```

**Response:** 302 redirect to original URL

### GET /me/links (Authenticated)

Get all links created by authenticated user.

```bash
curl -X GET "https://your-api-url/dev/me/links" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Response:**
```json
{
  "count": 2,
  "links": [
    {
      "short_code": "aBcD1234",
      "short_url": "https://shorturl.life/aBcD1234",
      "original_url": "https://www.example.com",
      "created_at": 1703001234567
    }
  ]
}
```

## DynamoDB Schema

**Table:** url_mappings

| Attribute    | Type   | Key Type       | Description                     |
|--------------|--------|----------------|---------------------------------|
| ShortCode    | String | Partition Key  | 8-char random URL-safe code    |
| OriginalURL  | String | -              | Full URL to redirect to         |
| UserId       | String | GSI Partition  | Cognito sub or "anonymous"      |
| CreatedAt    | Number | GSI Sort Key   | Unix timestamp (milliseconds)   |

**Global Secondary Index:** UserIdIndex
- Partition Key: `UserId`
- Sort Key: `CreatedAt`
- Projection: ALL

This design enables:
- O(1) URL expansion by ShortCode
- Efficient user link queries via GSI
- Time-ordered results (newest first)

## Authentication Flow

1. **Sign Up**: User creates account via Cognito
2. **Email Verification**: Automatic email confirmation
3. **Sign In**: Returns JWT ID token
4. **API Calls**: Include `Authorization: Bearer <token>` header
5. **Token Refresh**: Use refresh token when ID token expires (1 hour)

### Getting a JWT Token

```bash
# Sign up
aws cognito-idp sign-up \
  --client-id <CLIENT_ID> \
  --username user@example.com \
  --password "Password123!" \
  --user-attributes Name=email,Value=user@example.com

# Confirm user (dev only)
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id <POOL_ID> \
  --username user@example.com

# Sign in
aws cognito-idp initiate-auth \
  --client-id <CLIENT_ID> \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=user@example.com,PASSWORD="Password123!" \
  --query 'AuthenticationResult.IdToken' \
  --output text
```

## Project Structure

```
Shorten-URL/
├── lambda/
│   ├── shared/
│   │   └── shortCodeGenerator.js    # Shared utilities
│   ├── shortenURL/                   # POST /shorten
│   │   ├── index.js
│   │   └── package.json
│   ├── expandURL/                    # GET /expand/{short}
│   │   ├── index.js
│   │   └── package.json
│   └── getUserLinks/                 # GET /me/links
│       ├── index.js
│       └── package.json
├── terraform/
│   └── dev/
│       ├── provider.tf               # AWS provider config
│       ├── variables.tf              # Input variables
│       ├── cognito.tf                # User pool & client
│       ├── dynamodb.tf               # Table with GSI
│       ├── api_gateway.tf            # REST API & authorizer
│       ├── lambda.tf                 # Lambda functions
│       ├── iam.tf                    # IAM roles & policies
│       └── outputs.tf                # Export values
├── ARCHITECTURE.md                   # Detailed architecture docs
├── DEPLOYMENT.md                     # Deployment guide
├── MIGRATION.md                      # Schema migration guide
└── README.md                         # This file
```

## Short Code Generation

Uses cryptographically secure random generation:

1. Generate 6 random bytes (`crypto.randomBytes(6)`)
2. Base64 encode (produces 8 characters)
3. Make URL-safe: replace `+` → `-`, `/` → `_`, remove `=`
4. Result: 8 characters from `[A-Za-z0-9_-]`

**Entropy:** 48 bits (281 trillion possible codes)

**Collision Handling:**
- DynamoDB conditional write: `attribute_not_exists(ShortCode)`
- Retry up to 5 times with new random code
- Probability of collision: ~0.01% at 1 billion URLs

## Security Features

- **JWT Authentication**: Cognito-managed tokens
- **Secure Random Codes**: No predictable patterns
- **Atomic Writes**: DynamoDB conditional expressions prevent overwriting
- **CORS Protection**: Configurable allowed origins
- **Input Validation**: URL format validation
- **Encryption**: DynamoDB encryption at rest (default)
- **HTTPS Only**: All API calls over TLS

## Monitoring

### CloudWatch Logs

```bash
# Lambda logs
aws logs tail /aws/lambda/url-shortener-dev-shorten-url --follow
aws logs tail /aws/lambda/url-shortener-dev-expand-url --follow
aws logs tail /aws/lambda/url-shortener-dev-get-user-links --follow

# API Gateway logs
aws logs tail /aws/apigateway/url-shortener-dev --follow
```

### Key Metrics

- Lambda: Invocations, Errors, Duration
- API Gateway: 4xx/5xx errors, Latency
- DynamoDB: Consumed capacity, Throttles
- Cognito: Sign-ups, Sign-ins

## Cost Estimation

### Development (light usage)
- **Total: ~$0-10/month** (mostly within free tier)

### Production (1M URLs/month, 10M redirects)
- Lambda: ~$20
- API Gateway: ~$35
- DynamoDB: ~$25
- Cognito: ~$0-50 (depends on MAU)
- **Total: ~$85-135/month**

Pay-per-request pricing scales with usage.

## Migration from Old Schema

If you have an existing deployment with the old schema (`ShortenedURL` key), see [MIGRATION.md](MIGRATION.md) for migration instructions.

## Development Workflow

### Local Testing

```bash
# Test short code generator
cd lambda/shared
node -e "import('./shortCodeGenerator.js').then(m => console.log(m.generateSecureShortCode()))"

# Validate Lambda code
cd ../shortenURL
node --check index.js
```

### Deploy Changes

```bash
# Make code changes
# ...

# Apply with Terraform (automatically packages and uploads)
cd terraform/dev
terraform apply
```

### View Logs

```bash
# Stream logs in real-time
aws logs tail /aws/lambda/url-shortener-dev-shorten-url --follow
```

## Production Deployment

1. Create `terraform/prod` directory
2. Update variables for production
3. Enable additional features:
   - MFA for Cognito
   - Deletion protection
   - CloudWatch alarms
   - Custom domain (optional)
4. Deploy: `terraform apply`

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production setup.

## Troubleshooting

### Common Issues

**Issue:** CORS errors in browser
**Solution:** Verify CORS headers are returned, check OPTIONS method

**Issue:** JWT validation fails
**Solution:** Ensure using ID token (not access token), check expiration

**Issue:** "URL not found" for old links
**Solution:** Check DynamoDB key name changed from `ShortenedURL` to `ShortCode`

See [DEPLOYMENT.md](DEPLOYMENT.md) Troubleshooting section for more.

## Future Enhancements

- [ ] Custom short codes (user-provided)
- [ ] Link expiration (TTL)
- [ ] Click tracking and analytics
- [ ] QR code generation
- [ ] Link preview with Open Graph
- [ ] Rate limiting per user
- [ ] Multi-region deployment
- [ ] Custom domains per user

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Test thoroughly in dev environment
5. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

- **Documentation**: See ARCHITECTURE.md and DEPLOYMENT.md
- **Issues**: Open a GitHub issue
- **AWS Support**: Use AWS Support Center for infrastructure issues

## Authors

Built with Terraform and AWS SDK v3 for Node.js.

---

**Ready to deploy?** Start with [DEPLOYMENT.md](DEPLOYMENT.md)

**Need to migrate?** See [MIGRATION.md](MIGRATION.md)

**Want to understand the design?** Read [ARCHITECTURE.md](ARCHITECTURE.md)
