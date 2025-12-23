# API Gateway REST API
resource "aws_api_gateway_rest_api" "url_shortener" {
  name        = "${var.project_name}-${var.environment}-api"
  description = "API Gateway for URL Shortener service - ${var.environment} environment"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-api"
    }
  )
}

# Cognito Authorizer for API Gateway
resource "aws_api_gateway_authorizer" "cognito" {
  name          = "${var.project_name}-${var.environment}-cognito-authorizer"
  type          = "COGNITO_USER_POOLS"
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  provider_arns = [aws_cognito_user_pool.url_shortener.arn]

  identity_source = "method.request.header.Authorization"
}

# /shorten resource
resource "aws_api_gateway_resource" "shorten" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  parent_id   = aws_api_gateway_rest_api.url_shortener.root_resource_id
  path_part   = "shorten"
}

# POST method for /shorten
resource "aws_api_gateway_method" "shorten_post" {
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  resource_id   = aws_api_gateway_resource.shorten.id
  http_method   = "POST"
  authorization = "NONE"
}

# Integration for /shorten POST
resource "aws_api_gateway_integration" "shorten_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.url_shortener.id
  resource_id             = aws_api_gateway_resource.shorten.id
  http_method             = aws_api_gateway_method.shorten_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.shorten_url.invoke_arn
}

# /expand resource
resource "aws_api_gateway_resource" "expand" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  parent_id   = aws_api_gateway_rest_api.url_shortener.root_resource_id
  path_part   = "expand"
}

# /{short} resource under /expand
resource "aws_api_gateway_resource" "expand_short" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  parent_id   = aws_api_gateway_resource.expand.id
  path_part   = "{short}"
}

# GET method for /expand/{short}
resource "aws_api_gateway_method" "expand_get" {
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  resource_id   = aws_api_gateway_resource.expand_short.id
  http_method   = "GET"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.short" = true
  }
}

# Integration for /expand/{short} GET
resource "aws_api_gateway_integration" "expand_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.url_shortener.id
  resource_id             = aws_api_gateway_resource.expand_short.id
  http_method             = aws_api_gateway_method.expand_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.expand_url.invoke_arn
}

# /auth resource (for authentication endpoints)
resource "aws_api_gateway_resource" "auth" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  parent_id   = aws_api_gateway_rest_api.url_shortener.root_resource_id
  path_part   = "auth"
}

# /auth/signup resource
resource "aws_api_gateway_resource" "auth_signup" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "signup"
}

# POST method for /auth/signup
resource "aws_api_gateway_method" "auth_signup_post" {
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  resource_id   = aws_api_gateway_resource.auth_signup.id
  http_method   = "POST"
  authorization = "NONE"
}

# Integration for /auth/signup POST
resource "aws_api_gateway_integration" "auth_signup_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.url_shortener.id
  resource_id             = aws_api_gateway_resource.auth_signup.id
  http_method             = aws_api_gateway_method.auth_signup_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.signup.invoke_arn
}

# /auth/login resource
resource "aws_api_gateway_resource" "auth_login" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "login"
}

# POST method for /auth/login
resource "aws_api_gateway_method" "auth_login_post" {
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  resource_id   = aws_api_gateway_resource.auth_login.id
  http_method   = "POST"
  authorization = "NONE"
}

# Integration for /auth/login POST
resource "aws_api_gateway_integration" "auth_login_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.url_shortener.id
  resource_id             = aws_api_gateway_resource.auth_login.id
  http_method             = aws_api_gateway_method.auth_login_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.login.invoke_arn
}

# /auth/forgot-password resource
resource "aws_api_gateway_resource" "auth_forgot_password" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "forgot-password"
}

# POST method for /auth/forgot-password
resource "aws_api_gateway_method" "auth_forgot_password_post" {
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  resource_id   = aws_api_gateway_resource.auth_forgot_password.id
  http_method   = "POST"
  authorization = "NONE"
}

# Integration for /auth/forgot-password POST
resource "aws_api_gateway_integration" "auth_forgot_password_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.url_shortener.id
  resource_id             = aws_api_gateway_resource.auth_forgot_password.id
  http_method             = aws_api_gateway_method.auth_forgot_password_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.forgot_password.invoke_arn
}

# /auth/reset-password resource
resource "aws_api_gateway_resource" "auth_reset_password" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "reset-password"
}

# POST method for /auth/reset-password
resource "aws_api_gateway_method" "auth_reset_password_post" {
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  resource_id   = aws_api_gateway_resource.auth_reset_password.id
  http_method   = "POST"
  authorization = "NONE"
}

# Integration for /auth/reset-password POST
resource "aws_api_gateway_integration" "auth_reset_password_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.url_shortener.id
  resource_id             = aws_api_gateway_resource.auth_reset_password.id
  http_method             = aws_api_gateway_method.auth_reset_password_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.reset_password.invoke_arn
}

# /auth/verify-email resource
resource "aws_api_gateway_resource" "auth_verify_email" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "verify-email"
}

# POST method for /auth/verify-email
resource "aws_api_gateway_method" "auth_verify_email_post" {
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  resource_id   = aws_api_gateway_resource.auth_verify_email.id
  http_method   = "POST"
  authorization = "NONE"
}

# Integration for /auth/verify-email POST
resource "aws_api_gateway_integration" "auth_verify_email_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.url_shortener.id
  resource_id             = aws_api_gateway_resource.auth_verify_email.id
  http_method             = aws_api_gateway_method.auth_verify_email_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.verify_email.invoke_arn
}

# /auth/resend-verification resource
resource "aws_api_gateway_resource" "auth_resend_verification" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "resend-verification"
}

# POST method for /auth/resend-verification
resource "aws_api_gateway_method" "auth_resend_verification_post" {
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  resource_id   = aws_api_gateway_resource.auth_resend_verification.id
  http_method   = "POST"
  authorization = "NONE"
}

# Integration for /auth/resend-verification POST
resource "aws_api_gateway_integration" "auth_resend_verification_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.url_shortener.id
  resource_id             = aws_api_gateway_resource.auth_resend_verification.id
  http_method             = aws_api_gateway_method.auth_resend_verification_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.resend_verification.invoke_arn
}

# /me resource (for authenticated user endpoints)
resource "aws_api_gateway_resource" "me" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  parent_id   = aws_api_gateway_rest_api.url_shortener.root_resource_id
  path_part   = "me"
}

# /me/links resource
resource "aws_api_gateway_resource" "me_links" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  parent_id   = aws_api_gateway_resource.me.id
  path_part   = "links"
}

# GET method for /me/links (authenticated only)
resource "aws_api_gateway_method" "me_links_get" {
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  resource_id   = aws_api_gateway_resource.me_links.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# Integration for /me/links GET
resource "aws_api_gateway_integration" "me_links_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.url_shortener.id
  resource_id             = aws_api_gateway_resource.me_links.id
  http_method             = aws_api_gateway_method.me_links_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_user_links.invoke_arn
}

# Enable CORS for /shorten
resource "aws_api_gateway_method" "shorten_options" {
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  resource_id   = aws_api_gateway_resource.shorten.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "shorten_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.shorten.id
  http_method = aws_api_gateway_method.shorten_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "shorten_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.shorten.id
  http_method = aws_api_gateway_method.shorten_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "shorten_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.shorten.id
  http_method = aws_api_gateway_method.shorten_options.http_method
  status_code = aws_api_gateway_method_response.shorten_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Enable CORS for /expand/{short}
resource "aws_api_gateway_method" "expand_options" {
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  resource_id   = aws_api_gateway_resource.expand_short.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "expand_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.expand_short.id
  http_method = aws_api_gateway_method.expand_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "expand_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.expand_short.id
  http_method = aws_api_gateway_method.expand_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "expand_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.expand_short.id
  http_method = aws_api_gateway_method.expand_options.http_method
  status_code = aws_api_gateway_method_response.expand_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Enable CORS for /auth/signup
resource "aws_api_gateway_method" "auth_signup_options" {
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  resource_id   = aws_api_gateway_resource.auth_signup.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_signup_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.auth_signup.id
  http_method = aws_api_gateway_method.auth_signup_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "auth_signup_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.auth_signup.id
  http_method = aws_api_gateway_method.auth_signup_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "auth_signup_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.auth_signup.id
  http_method = aws_api_gateway_method.auth_signup_options.http_method
  status_code = aws_api_gateway_method_response.auth_signup_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Enable CORS for /auth/login
resource "aws_api_gateway_method" "auth_login_options" {
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  resource_id   = aws_api_gateway_resource.auth_login.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_login_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.auth_login.id
  http_method = aws_api_gateway_method.auth_login_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "auth_login_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.auth_login.id
  http_method = aws_api_gateway_method.auth_login_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "auth_login_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.auth_login.id
  http_method = aws_api_gateway_method.auth_login_options.http_method
  status_code = aws_api_gateway_method_response.auth_login_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Enable CORS for /auth/forgot-password
resource "aws_api_gateway_method" "auth_forgot_password_options" {
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  resource_id   = aws_api_gateway_resource.auth_forgot_password.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_forgot_password_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.auth_forgot_password.id
  http_method = aws_api_gateway_method.auth_forgot_password_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "auth_forgot_password_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.auth_forgot_password.id
  http_method = aws_api_gateway_method.auth_forgot_password_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "auth_forgot_password_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.auth_forgot_password.id
  http_method = aws_api_gateway_method.auth_forgot_password_options.http_method
  status_code = aws_api_gateway_method_response.auth_forgot_password_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Enable CORS for /auth/reset-password
resource "aws_api_gateway_method" "auth_reset_password_options" {
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  resource_id   = aws_api_gateway_resource.auth_reset_password.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_reset_password_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.auth_reset_password.id
  http_method = aws_api_gateway_method.auth_reset_password_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "auth_reset_password_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.auth_reset_password.id
  http_method = aws_api_gateway_method.auth_reset_password_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "auth_reset_password_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.auth_reset_password.id
  http_method = aws_api_gateway_method.auth_reset_password_options.http_method
  status_code = aws_api_gateway_method_response.auth_reset_password_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Enable CORS for /auth/verify-email
resource "aws_api_gateway_method" "auth_verify_email_options" {
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  resource_id   = aws_api_gateway_resource.auth_verify_email.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_verify_email_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.auth_verify_email.id
  http_method = aws_api_gateway_method.auth_verify_email_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "auth_verify_email_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.auth_verify_email.id
  http_method = aws_api_gateway_method.auth_verify_email_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "auth_verify_email_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.auth_verify_email.id
  http_method = aws_api_gateway_method.auth_verify_email_options.http_method
  status_code = aws_api_gateway_method_response.auth_verify_email_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Enable CORS for /auth/resend-verification
resource "aws_api_gateway_method" "auth_resend_verification_options" {
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  resource_id   = aws_api_gateway_resource.auth_resend_verification.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "auth_resend_verification_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.auth_resend_verification.id
  http_method = aws_api_gateway_method.auth_resend_verification_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "auth_resend_verification_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.auth_resend_verification.id
  http_method = aws_api_gateway_method.auth_resend_verification_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "auth_resend_verification_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.auth_resend_verification.id
  http_method = aws_api_gateway_method.auth_resend_verification_options.http_method
  status_code = aws_api_gateway_method_response.auth_resend_verification_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# /feedback resource
resource "aws_api_gateway_resource" "feedback" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  parent_id   = aws_api_gateway_rest_api.url_shortener.root_resource_id
  path_part   = "feedback"
}

# POST method for /feedback
resource "aws_api_gateway_method" "feedback_post" {
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  resource_id   = aws_api_gateway_resource.feedback.id
  http_method   = "POST"
  authorization = "NONE"
}

# Integration for /feedback POST
resource "aws_api_gateway_integration" "feedback_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.url_shortener.id
  resource_id             = aws_api_gateway_resource.feedback.id
  http_method             = aws_api_gateway_method.feedback_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.submit_feedback.invoke_arn
}

# Enable CORS for /feedback
resource "aws_api_gateway_method" "feedback_options" {
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  resource_id   = aws_api_gateway_resource.feedback.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "feedback_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.feedback.id
  http_method = aws_api_gateway_method.feedback_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "feedback_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.feedback.id
  http_method = aws_api_gateway_method.feedback_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "feedback_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.feedback.id
  http_method = aws_api_gateway_method.feedback_options.http_method
  status_code = aws_api_gateway_method_response.feedback_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Enable CORS for /me/links
resource "aws_api_gateway_method" "me_links_options" {
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  resource_id   = aws_api_gateway_resource.me_links.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "me_links_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.me_links.id
  http_method = aws_api_gateway_method.me_links_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "me_links_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.me_links.id
  http_method = aws_api_gateway_method.me_links_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "me_links_options" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  resource_id = aws_api_gateway_resource.me_links.id
  http_method = aws_api_gateway_method.me_links_options.http_method
  status_code = aws_api_gateway_method_response.me_links_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "url_shortener" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id

  depends_on = [
    aws_api_gateway_integration.shorten_lambda,
    aws_api_gateway_integration.expand_lambda,
    aws_api_gateway_integration.me_links_lambda,
    aws_api_gateway_integration.auth_signup_lambda,
    aws_api_gateway_integration.auth_login_lambda,
    aws_api_gateway_integration.auth_forgot_password_lambda,
    aws_api_gateway_integration.auth_reset_password_lambda,
    aws_api_gateway_integration.auth_verify_email_lambda,
    aws_api_gateway_integration.auth_resend_verification_lambda,
    aws_api_gateway_integration.feedback_lambda,
    aws_api_gateway_integration.shorten_options,
    aws_api_gateway_integration.expand_options,
    aws_api_gateway_integration.me_links_options,
    aws_api_gateway_integration.auth_signup_options,
    aws_api_gateway_integration.auth_login_options,
    aws_api_gateway_integration.auth_forgot_password_options,
    aws_api_gateway_integration.auth_reset_password_options,
    aws_api_gateway_integration.auth_verify_email_options,
    aws_api_gateway_integration.auth_resend_verification_options,
    aws_api_gateway_integration.feedback_options
  ]

  lifecycle {
    create_before_destroy = true
  }

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.shorten.id,
      aws_api_gateway_resource.expand.id,
      aws_api_gateway_resource.expand_short.id,
      aws_api_gateway_resource.me.id,
      aws_api_gateway_resource.me_links.id,
      aws_api_gateway_resource.auth.id,
      aws_api_gateway_resource.auth_signup.id,
      aws_api_gateway_resource.auth_login.id,
      aws_api_gateway_resource.auth_forgot_password.id,
      aws_api_gateway_resource.auth_reset_password.id,
      aws_api_gateway_resource.auth_verify_email.id,
      aws_api_gateway_resource.auth_resend_verification.id,
      aws_api_gateway_resource.feedback.id,
      aws_api_gateway_method.shorten_post.id,
      aws_api_gateway_method.expand_get.id,
      aws_api_gateway_method.me_links_get.id,
      aws_api_gateway_method.auth_signup_post.id,
      aws_api_gateway_method.auth_login_post.id,
      aws_api_gateway_method.auth_forgot_password_post.id,
      aws_api_gateway_method.auth_reset_password_post.id,
      aws_api_gateway_method.auth_verify_email_post.id,
      aws_api_gateway_method.auth_resend_verification_post.id,
      aws_api_gateway_method.feedback_post.id,
      aws_api_gateway_integration.shorten_lambda.id,
      aws_api_gateway_integration.expand_lambda.id,
      aws_api_gateway_integration.me_links_lambda.id,
      aws_api_gateway_integration.auth_signup_lambda.id,
      aws_api_gateway_integration.auth_login_lambda.id,
      aws_api_gateway_integration.auth_forgot_password_lambda.id,
      aws_api_gateway_integration.auth_reset_password_lambda.id,
      aws_api_gateway_integration.auth_verify_email_lambda.id,
      aws_api_gateway_integration.auth_resend_verification_lambda.id,
      aws_api_gateway_integration.feedback_lambda.id,
      aws_api_gateway_authorizer.cognito.id,
    ]))
  }
}

# API Gateway Stage
resource "aws_api_gateway_stage" "url_shortener" {
  deployment_id = aws_api_gateway_deployment.url_shortener.id
  rest_api_id   = aws_api_gateway_rest_api.url_shortener.id
  stage_name    = var.environment

  # Enable CloudWatch logging
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  depends_on = [aws_api_gateway_account.main]

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-stage"
    }
  )
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}"
  retention_in_days = 7  # Short retention for dev environment

  tags = var.tags
}

# API Gateway Method Settings
resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.url_shortener.id
  stage_name  = aws_api_gateway_stage.url_shortener.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled    = true
    logging_level      = "INFO"
    data_trace_enabled = true
  }
}
