# S3 bucket for hosting the landing page
resource "aws_s3_bucket" "landing_page" {
  bucket = "www.shorturl.life"

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-landing-page"
  })
}

# S3 bucket public access settings
resource "aws_s3_bucket_public_access_block" "landing_page" {
  bucket = aws_s3_bucket.landing_page.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket website configuration
resource "aws_s3_bucket_website_configuration" "landing_page" {
  bucket = aws_s3_bucket.landing_page.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"  # For React Router - all routes go to index.html
  }
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "landing_page" {
  bucket = aws_s3_bucket.landing_page.id

  versioning_configuration {
    status = "Enabled"
  }
}

# CloudFront Origin Access Control (OAC)
resource "aws_cloudfront_origin_access_control" "landing_page" {
  name                              = "${var.project_name}-${var.environment}-landing-page-oac"
  description                       = "OAC for landing page S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ACM Certificate for www.shorturl.life (must be in us-east-1 for CloudFront)
resource "aws_acm_certificate" "www_domain" {
  provider          = aws.us_east_1
  domain_name       = "www.shorturl.life"
  validation_method = "DNS"

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-www-certificate"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Route 53 record for ACM certificate validation (www)
resource "aws_route53_record" "www_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.www_domain.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

# Wait for certificate validation (www)
resource "aws_acm_certificate_validation" "www_domain" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.www_domain.arn
  validation_record_fqdns = [for record in aws_route53_record.www_cert_validation : record.fqdn]
}

# CloudFront distribution for www.shorturl.life
resource "aws_cloudfront_distribution" "landing_page" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = ["www.shorturl.life"]
  price_class         = "PriceClass_100"  # Use only North America and Europe edge locations

  origin {
    domain_name              = aws_s3_bucket.landing_page.bucket_regional_domain_name
    origin_id                = "S3-${aws_s3_bucket.landing_page.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.landing_page.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-${aws_s3_bucket.landing_page.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600    # 1 hour
    max_ttl                = 86400   # 24 hours
    compress               = true
  }

  # Custom error response for React Router
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.www_domain.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-landing-page-cdn"
  })
}

# S3 bucket policy to allow CloudFront OAC access
resource "aws_s3_bucket_policy" "landing_page" {
  bucket = aws_s3_bucket.landing_page.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.landing_page.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.landing_page.arn
          }
        }
      }
    ]
  })
}

# Route 53 A record for www.shorturl.life pointing to CloudFront
resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "www.shorturl.life"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.landing_page.domain_name
    zone_id                = aws_cloudfront_distribution.landing_page.hosted_zone_id
    evaluate_target_health = false
  }
}
