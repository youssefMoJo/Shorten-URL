# Data source to get the existing Route 53 hosted zone for shorturl.life
data "aws_route53_zone" "main" {
  name         = "shorturl.life"
  private_zone = false
}

# ACM Certificate for shorturl.life
# Note: ACM certificates for API Gateway custom domains in regional endpoints
# must be in the same region as the API Gateway
resource "aws_acm_certificate" "prod_domain" {
  domain_name       = "shorturl.life"
  validation_method = "DNS"

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-certificate"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Route 53 record for ACM certificate validation
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.prod_domain.domain_validation_options : dvo.domain_name => {
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

# Wait for certificate validation
resource "aws_acm_certificate_validation" "prod_domain" {
  certificate_arn         = aws_acm_certificate.prod_domain.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# API Gateway Custom Domain Name
resource "aws_api_gateway_domain_name" "prod_domain" {
  domain_name              = "shorturl.life"
  regional_certificate_arn = aws_acm_certificate_validation.prod_domain.certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-custom-domain"
  })
}

# Base Path Mapping - maps the custom domain to the API Gateway stage
resource "aws_api_gateway_base_path_mapping" "prod_domain" {
  api_id      = aws_api_gateway_rest_api.url_shortener.id
  stage_name  = aws_api_gateway_stage.url_shortener.stage_name
  domain_name = aws_api_gateway_domain_name.prod_domain.domain_name
}

# Route 53 A record to point shorturl.life to API Gateway
resource "aws_route53_record" "prod_api" {
  name            = aws_api_gateway_domain_name.prod_domain.domain_name
  type            = "A"
  zone_id         = data.aws_route53_zone.main.zone_id
  allow_overwrite = true

  alias {
    name                   = aws_api_gateway_domain_name.prod_domain.regional_domain_name
    zone_id                = aws_api_gateway_domain_name.prod_domain.regional_zone_id
    evaluate_target_health = false
  }
}
