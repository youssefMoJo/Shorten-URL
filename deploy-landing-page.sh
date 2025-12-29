#!/bin/bash

# Deploy Landing Page to S3 and Invalidate CloudFront Cache
# Usage: ./deploy-landing-page.sh

set -e

BUCKET_NAME="www.shorturl.life"
DISTRIBUTION_ID=$(cd terraform/prod && terraform output -raw landing_page_cloudfront_distribution_id 2>/dev/null || echo "")

echo "🚀 Deploying landing page to S3..."

# Build the landing page (if not already built)
if [ ! -d "landing-page/dist" ]; then
  echo "📦 Building landing page..."
  cd landing-page && npm run build && cd ..
fi

# Sync files to S3
echo "📤 Uploading files to s3://${BUCKET_NAME}..."
aws --profile "AWS youssefrafaat67" s3 sync landing-page/dist/ s3://${BUCKET_NAME}/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html" \
  --exclude "*.json"

# Upload HTML and JSON files with different cache settings
aws --profile "AWS youssefrafaat67" s3 sync landing-page/dist/ s3://${BUCKET_NAME}/ \
  --exclude "*" \
  --include "*.html" \
  --include "*.json" \
  --cache-control "public, max-age=0, must-revalidate"

echo "✅ Files uploaded successfully!"

# Invalidate CloudFront cache
if [ -n "$DISTRIBUTION_ID" ]; then
  echo "🔄 Invalidating CloudFront cache..."
  aws --profile "AWS youssefrafaat67" cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*"
  echo "✅ CloudFront cache invalidation started!"
else
  echo "⚠️  Could not get CloudFront distribution ID. Skipping cache invalidation."
  echo "   Run manually: aws cloudfront create-invalidation --distribution-id <ID> --paths '/*'"
fi

echo ""
echo "🎉 Deployment complete!"
echo "🌐 Your landing page will be available at: https://www.shorturl.life"
echo "   Note: CloudFront propagation may take 5-15 minutes."
