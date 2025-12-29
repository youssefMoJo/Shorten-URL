# Setting Up dev.shorturl.life for Testing

This guide walks you through setting up the `dev.shorturl.life` subdomain for testing before deploying to production.

## What Was Configured

### Infrastructure Changes
1. **Custom Domain Setup** ([terraform/dev/custom_domain.tf](terraform/dev/custom_domain.tf))
   - ACM certificate for `dev.shorturl.life`
   - Automatic DNS validation via Route 53
   - API Gateway custom domain mapping
   - Route 53 A record pointing to API Gateway

2. **Updated Outputs** ([terraform/dev/outputs.tf](terraform/dev/outputs.tf))
   - Added `custom_domain_name`
   - Added `custom_domain_url`
   - Added `custom_api_endpoints` with dev.shorturl.life URLs

### Chrome Extension Changes
1. **Environment Configs** ([extension/](extension/))
   - `config.js` - Active config (now set to DEV)
   - `config.dev.js` - Dev environment config
   - `config.prod.js` - Prod environment config

2. **Updated README** ([extension/README.md](extension/README.md))
   - Instructions for switching between environments
   - Testing workflow documentation

## Deployment Steps

### Step 1: Apply Terraform Configuration

```bash
cd terraform/dev
terraform init
terraform plan
```

Review the plan carefully. You should see:
- New ACM certificate for dev.shorturl.life
- Route 53 validation records
- API Gateway custom domain
- Base path mapping
- Route 53 A record

If everything looks good:

```bash
terraform apply
```

Type `yes` when prompted.

### Step 2: Wait for Certificate Validation

The ACM certificate validation is automatic but takes 5-10 minutes:

```bash
# Check the status
terraform output custom_domain_url

# Verify DNS propagation
nslookup dev.shorturl.life
```

Once DNS is propagated, you should see the API Gateway endpoint.

### Step 3: Verify the Custom Domain

```bash
# Get the custom domain endpoints
terraform output custom_api_endpoints

# Test the shorten endpoint (without auth)
curl -X POST https://dev.shorturl.life/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Step 4: Test with Chrome Extension

The extension is already configured for dev environment. Just reload it:

1. Open Chrome and go to `chrome://extensions/`
2. Find "Shorten-URL" extension
3. Click the reload icon (circular arrow)
4. Test shortening a URL

### Step 5: Switch to Production (When Ready)

After testing is complete:

1. **Update extension to prod:**
   ```bash
   cd extension
   cp config.prod.js config.js
   ```

2. **Copy custom domain config to prod:**
   ```bash
   cp terraform/dev/custom_domain.tf terraform/prod/
   ```

3. **Update the domain in prod config:**
   Edit `terraform/prod/custom_domain.tf` and change all instances of `dev.shorturl.life` to `shorturl.life`

4. **Apply to prod:**
   ```bash
   cd terraform/prod
   terraform plan
   terraform apply
   ```

## Environment URLs

| Environment | API Base URL | Dashboard |
|-------------|-------------|-----------|
| Dev | https://dev.shorturl.life | https://dev.shorturl.life/dashboard |
| Prod | https://shorturl.life | https://shorturl.life/dashboard |

## Troubleshooting

### Certificate Validation Taking Too Long
- Check Route 53 for validation records
- Verify the hosted zone for shorturl.life exists
- Wait up to 30 minutes for global DNS propagation

### API Gateway 403/404 Errors
- Verify the base path mapping was created
- Check API Gateway stage is deployed
- Ensure custom domain status is "Available" in AWS Console

### Extension Not Connecting
- Verify you reloaded the extension after config change
- Check browser console for errors (F12)
- Confirm DNS is resolving correctly: `nslookup dev.shorturl.life`
- Test the API directly with curl to isolate extension vs API issues

### DNS Not Resolving
```bash
# Check if Route 53 record exists
aws route53 list-resource-record-sets \
  --hosted-zone-id <your-zone-id> \
  --query "ResourceRecordSets[?Name=='dev.shorturl.life.']"

# Try different DNS server
nslookup dev.shorturl.life 8.8.8.8
```

## Quick Reference Commands

```bash
# Check custom domain status
cd terraform/dev && terraform output custom_domain_url

# Switch extension to dev
cd extension && cp config.dev.js config.js

# Switch extension to prod
cd extension && cp config.prod.js config.js

# Test API endpoint
curl https://dev.shorturl.life/shorten -X POST \
  -H "Content-Type: application/json" \
  -d '{"url": "https://test.com"}'
```

## Next Steps

1. Apply the terraform configuration
2. Wait for DNS propagation
3. Test with the Chrome extension
4. Verify all functionality works
5. When satisfied, promote to production
