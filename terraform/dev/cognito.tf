# Cognito User Pool for authentication
resource "aws_cognito_user_pool" "url_shortener" {
  name = "${var.project_name}-${var.environment}-user-pool"

  # Allow users to sign in with email
  username_attributes = ["email"]
  # Disable auto-verification for seamless signup
  auto_verified_attributes = []

  # Password policy
  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # User attributes
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = false

    string_attribute_constraints {
      min_length = 5
      max_length = 254
    }
  }

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # MFA configuration (optional for dev, recommended for prod)
  mfa_configuration = "OFF"

  # User pool deletion protection for production
  deletion_protection = var.environment == "prod" ? "ACTIVE" : "INACTIVE"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-user-pool"
    }
  )
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "url_shortener" {
  name         = "${var.project_name}-${var.environment}-client"
  user_pool_id = aws_cognito_user_pool.url_shortener.id

  # OAuth configuration
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH" # For development ease, remove in production
  ]

  # Token validity
  access_token_validity  = 1  # 1 hour
  id_token_validity      = 1  # 1 hour
  refresh_token_validity = 30 # 30 days

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Don't generate secret (for public clients like web/mobile)
  generate_secret = false

  # Prevent user existence errors
  prevent_user_existence_errors = "ENABLED"

  # Allowed OAuth flows
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  # Callback URLs (update for your domain)
  callback_urls = [
    "http://localhost:3000/callback",
    "https://${var.project_name}.${var.environment}.com/callback"
  ]

  logout_urls = [
    "http://localhost:3000/logout",
    "https://${var.project_name}.${var.environment}.com/logout"
  ]

  supported_identity_providers = ["COGNITO"]
}

# Cognito User Pool Domain (for hosted UI)
resource "aws_cognito_user_pool_domain" "url_shortener" {
  domain       = lower("${var.project_name}-${var.environment}-${random_string.cognito_domain_suffix.result}")
  user_pool_id = aws_cognito_user_pool.url_shortener.id
}

# Random suffix for globally unique Cognito domain
resource "random_string" "cognito_domain_suffix" {
  length  = 8
  special = false
  upper   = false
  lower   = true
  numeric = true
}
