# Deployment Workflow: Dev to Production

This document outlines how to promote changes from development to production.

## Infrastructure Changes (Terraform)

When you modify Terraform configurations in `terraform/dev/`:

### Step 1: Test in Dev
```bash
cd terraform/dev
terraform plan
terraform apply
```

### Step 2: Copy Changes to Prod
```bash
# From the project root
# Copy the specific file(s) you changed
cp terraform/dev/<modified-file>.tf terraform/prod/
```

**IMPORTANT**: After copying, review the prod file to ensure:
- Environment-specific values are correct (e.g., `prod` not `dev`)
- Resource names use production naming
- Configuration is production-appropriate

### Step 3: Review Prod Changes
```bash
cd terraform/prod
terraform plan
```

Carefully review the plan to ensure:
- No unexpected resource deletions
- Changes match your intentions
- Production-specific settings are preserved

### Step 4: Apply to Prod
```bash
terraform apply
```

---

## Application Code Changes (Lambda Functions)

When you modify Lambda function code in `lambda/`:

### Development Process
1. Make changes to Lambda code
2. Test locally if possible
3. Deploy to dev environment:
   ```bash
   cd terraform/dev
   terraform apply
   ```
4. Test the changes in dev environment using the dev API endpoint

### Production Deployment

**Option A: Using Terraform (Full Redeploy)**
```bash
cd terraform/prod
terraform apply
```
This will:
- Package the Lambda code
- Upload new versions
- Update all Lambda functions

**Option B: Direct Lambda Update (Faster for Code-Only Changes)**
```bash
# Navigate to Lambda directory
cd lambda/shortenURL

# Create deployment package
zip -r ../../deployment.zip . -x "*.git*" "node_modules/*"

# Update Lambda function
aws lambda update-function-code \
  --function-name Shorten-URL-prod-shortenURL \
  --zip-file fileb://../../deployment.zip \
  --profile "AWS youssefrafaat67"
```

Repeat for each Lambda function you modified.

---

## Best Practices

### 1. Version Control
```bash
# Always commit your changes
git add .
git commit -m "feat: describe your changes"
git push
```

### 2. Use Git Tags for Releases
```bash
# Tag the release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### 3. Deployment Checklist

Before deploying to production:
- [ ] Changes tested in dev environment
- [ ] Code reviewed (if working in a team)
- [ ] Terraform plan reviewed for prod
- [ ] Backup of current production state (if needed)
- [ ] Database migrations tested (if applicable)
- [ ] Rollback plan prepared
- [ ] Monitoring and logging verified

### 4. Progressive Rollout (Advanced)

For critical changes:
1. Deploy to dev first
2. Test thoroughly in dev
3. Consider canary deployment (if you have multiple instances)
4. Monitor metrics after prod deployment
5. Be ready to rollback if issues arise

---

## Rollback Procedures

### Terraform Rollback
```bash
# If you need to revert infrastructure changes
cd terraform/prod

# Option 1: Revert the .tf files to previous version
git checkout <previous-commit> -- <file>.tf
terraform apply

# Option 2: Use terraform state to restore
terraform state list  # Find the resource
terraform state show <resource>  # Review current state
```

### Lambda Code Rollback
```bash
# Update to previous version
aws lambda update-function-code \
  --function-name Shorten-URL-prod-shortenURL \
  --s3-bucket <backup-bucket> \
  --s3-key <previous-version>.zip \
  --profile "AWS youssefrafaat67"

# Or publish a new version from a previous commit
git checkout <previous-commit>
cd terraform/prod
terraform apply
```

---

## Environment Comparison

### Quick Diff Check
```bash
# Compare a specific file between environments
diff terraform/dev/api_gateway.tf terraform/prod/api_gateway.tf

# Compare all terraform files
diff -r terraform/dev/ terraform/prod/ --exclude="*.tfstate*" --exclude=".terraform"
```

---

## CI/CD Pipeline (Future Enhancement)

Consider setting up automated deployments using GitHub Actions:

```yaml
# .github/workflows/deploy-prod.yml
name: Deploy to Production
on:
  push:
    tags:
      - 'v*'
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
      - name: Terraform Apply
        run: |
          cd terraform/prod
          terraform init
          terraform apply -auto-approve
```

---

## Common Scenarios

### Scenario 1: Updated Lambda Function Code
```bash
# 1. Test in dev
cd terraform/dev && terraform apply

# 2. Deploy to prod
cd ../prod && terraform apply
```

### Scenario 2: Modified API Gateway Configuration
```bash
# 1. Copy changes
cp terraform/dev/api_gateway.tf terraform/prod/

# 2. Review and verify prod-specific settings are intact
# 3. Deploy
cd terraform/prod
terraform plan  # Review changes
terraform apply
```

### Scenario 3: Changed DynamoDB Schema (Add GSI)
```bash
# 1. Test in dev first
cd terraform/dev && terraform apply

# 2. Verify data integrity in dev
# 3. Copy to prod
cp terraform/dev/dynamodb.tf terraform/prod/

# 4. Plan and review carefully (schema changes can be destructive)
cd terraform/prod
terraform plan

# 5. Apply during low-traffic period
terraform apply
```

### Scenario 4: Environment Variables / Configuration
```bash
# Update terraform.tfvars or variables.tf in prod
cd terraform/prod
vim terraform.tfvars  # or variables.tf

# Apply changes
terraform apply
```

---

## Monitoring After Deployment

After deploying to production, monitor:

```bash
# Check Lambda logs
aws logs tail /aws/lambda/Shorten-URL-prod-shortenURL --follow --profile "AWS youssefrafaat67"

# Check API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=Shorten-URL-prod-api \
  --start-time 2025-12-27T00:00:00Z \
  --end-time 2025-12-27T23:59:59Z \
  --period 3600 \
  --statistics Sum \
  --profile "AWS youssefrafaat67"
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Test in dev | `cd terraform/dev && terraform apply` |
| Copy file to prod | `cp terraform/dev/<file>.tf terraform/prod/` |
| Review prod changes | `cd terraform/prod && terraform plan` |
| Deploy to prod | `cd terraform/prod && terraform apply` |
| View Lambda logs | `aws logs tail /aws/lambda/<function-name> --follow` |
| Rollback terraform | `git checkout <commit> -- <file>.tf && terraform apply` |

---

## Support & Troubleshooting

If you encounter issues:
1. Check Terraform plan output carefully
2. Review CloudWatch logs for errors
3. Verify IAM permissions
4. Check AWS service quotas
5. Review Terraform state files
