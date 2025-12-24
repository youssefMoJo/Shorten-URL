# Copy shared code to shortenURL Lambda directory before packaging
resource "null_resource" "copy_shared_to_shorten_url" {
  triggers = {
    short_code_generator = filemd5("${path.module}/../../lambda/shared/shortCodeGenerator.js")
    auth_helper         = filemd5("${path.module}/../../lambda/shared/authHelper.js")
  }

  provisioner "local-exec" {
    command = <<-EOT
      mkdir -p ${path.module}/../../lambda/shortenURL/shared
      cp ${path.module}/../../lambda/shared/shortCodeGenerator.js ${path.module}/../../lambda/shortenURL/shared/
      cp ${path.module}/../../lambda/shared/authHelper.js ${path.module}/../../lambda/shortenURL/shared/
    EOT
  }
}

# Archive the Lambda function with shared code
data "archive_file" "shorten_url_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../../lambda/shortenURL"
  output_path = "${path.module}/lambda_packages/shortenURL.zip"

  excludes = [
    "node_modules",
    "package-lock.json",
    ".git",
    ".gitignore"
  ]

  depends_on = [
    null_resource.copy_shared_to_shorten_url
  ]
}

data "archive_file" "expand_url_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../../lambda/expandURL"
  output_path = "${path.module}/lambda_packages/expandURL.zip"

  excludes = [
    "node_modules",
    "package-lock.json",
    ".git",
    ".gitignore"
  ]
}

data "archive_file" "get_user_links_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../../lambda/getUserLinks"
  output_path = "${path.module}/lambda_packages/getUserLinks.zip"

  excludes = [
    "node_modules",
    "package-lock.json",
    ".git",
    ".gitignore"
  ]
}

data "archive_file" "signup_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../../lambda/signup"
  output_path = "${path.module}/lambda_packages/signup.zip"

  excludes = [
    "node_modules",
    "package-lock.json",
    ".git",
    ".gitignore"
  ]
}

data "archive_file" "login_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../../lambda/login"
  output_path = "${path.module}/lambda_packages/login.zip"

  excludes = [
    "node_modules",
    "package-lock.json",
    ".git",
    ".gitignore"
  ]
}

data "archive_file" "forgot_password_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../../lambda/forgotPassword"
  output_path = "${path.module}/lambda_packages/forgotPassword.zip"

  excludes = [
    "node_modules",
    "package-lock.json",
    ".git",
    ".gitignore"
  ]
}

data "archive_file" "reset_password_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../../lambda/resetPassword"
  output_path = "${path.module}/lambda_packages/resetPassword.zip"

  excludes = [
    "node_modules",
    "package-lock.json",
    ".git",
    ".gitignore"
  ]
}

data "archive_file" "verify_email_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../../lambda/verifyEmail"
  output_path = "${path.module}/lambda_packages/verifyEmail.zip"

  excludes = [
    "node_modules",
    "package-lock.json",
    ".git",
    ".gitignore"
  ]
}

data "archive_file" "resend_verification_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../../lambda/resendVerification"
  output_path = "${path.module}/lambda_packages/resendVerification.zip"

  excludes = [
    "node_modules",
    "package-lock.json",
    ".git",
    ".gitignore"
  ]
}

data "archive_file" "submit_feedback_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../../lambda/submitFeedback"
  output_path = "${path.module}/lambda_packages/submitFeedback.zip"

  excludes = [
    "node_modules",
    "package-lock.json",
    ".git",
    ".gitignore"
  ]
}

data "archive_file" "refresh_token_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../../lambda/refreshToken"
  output_path = "${path.module}/lambda_packages/refreshToken.zip"

  excludes = [
    "node_modules",
    "package-lock.json",
    ".git",
    ".gitignore"
  ]
}

# Shorten URL Lambda Function
resource "aws_lambda_function" "shorten_url" {
  filename         = data.archive_file.shorten_url_lambda.output_path
  function_name    = "${var.project_name}-${var.environment}-shorten-url"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.shorten_url_lambda.output_base64sha256
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      TABLE_NAME        = aws_dynamodb_table.url_mappings.name
      AWS_REGION_CUSTOM = var.aws_region
      ENVIRONMENT       = var.environment
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-shorten-url"
    }
  )
}

# Expand URL Lambda Function
resource "aws_lambda_function" "expand_url" {
  filename         = data.archive_file.expand_url_lambda.output_path
  function_name    = "${var.project_name}-${var.environment}-expand-url"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.expand_url_lambda.output_base64sha256
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      TABLE_NAME        = aws_dynamodb_table.url_mappings.name
      AWS_REGION_CUSTOM = var.aws_region
      ENVIRONMENT       = var.environment
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-expand-url"
    }
  )
}

# CloudWatch Log Groups for Lambda functions
resource "aws_cloudwatch_log_group" "shorten_url_logs" {
  name              = "/aws/lambda/${aws_lambda_function.shorten_url.function_name}"
  retention_in_days = 7  # Short retention for dev environment

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "expand_url_logs" {
  name              = "/aws/lambda/${aws_lambda_function.expand_url.function_name}"
  retention_in_days = 7  # Short retention for dev environment

  tags = var.tags
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "shorten_url_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.shorten_url.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.url_shortener.execution_arn}/*/*"
}

resource "aws_lambda_permission" "expand_url_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.expand_url.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.url_shortener.execution_arn}/*/*"
}

# Get User Links Lambda Function
resource "aws_lambda_function" "get_user_links" {
  filename         = data.archive_file.get_user_links_lambda.output_path
  function_name    = "${var.project_name}-${var.environment}-get-user-links"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.get_user_links_lambda.output_base64sha256
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      TABLE_NAME        = aws_dynamodb_table.url_mappings.name
      AWS_REGION_CUSTOM = var.aws_region
      ENVIRONMENT       = var.environment
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-get-user-links"
    }
  )
}

# CloudWatch Log Group for Get User Links Lambda
resource "aws_cloudwatch_log_group" "get_user_links_logs" {
  name              = "/aws/lambda/${aws_lambda_function.get_user_links.function_name}"
  retention_in_days = 7

  tags = var.tags
}

# Lambda permission for API Gateway to invoke Get User Links
resource "aws_lambda_permission" "get_user_links_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_user_links.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.url_shortener.execution_arn}/*/*"
}

# Signup Lambda Function
resource "aws_lambda_function" "signup" {
  filename         = data.archive_file.signup_lambda.output_path
  function_name    = "${var.project_name}-${var.environment}-signup"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.signup_lambda.output_base64sha256
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      COGNITO_USER_POOL_ID = aws_cognito_user_pool.url_shortener.id
      COGNITO_CLIENT_ID    = aws_cognito_user_pool_client.url_shortener.id
      AWS_REGION_CUSTOM    = var.aws_region
      ENVIRONMENT          = var.environment
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-signup"
    }
  )
}

# Login Lambda Function
resource "aws_lambda_function" "login" {
  filename         = data.archive_file.login_lambda.output_path
  function_name    = "${var.project_name}-${var.environment}-login"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.login_lambda.output_base64sha256
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      COGNITO_CLIENT_ID = aws_cognito_user_pool_client.url_shortener.id
      AWS_REGION_CUSTOM = var.aws_region
      ENVIRONMENT       = var.environment
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-login"
    }
  )
}

# CloudWatch Log Group for Signup Lambda
resource "aws_cloudwatch_log_group" "signup_logs" {
  name              = "/aws/lambda/${aws_lambda_function.signup.function_name}"
  retention_in_days = 7

  tags = var.tags
}

# CloudWatch Log Group for Login Lambda
resource "aws_cloudwatch_log_group" "login_logs" {
  name              = "/aws/lambda/${aws_lambda_function.login.function_name}"
  retention_in_days = 7

  tags = var.tags
}

# Lambda permission for API Gateway to invoke Signup
resource "aws_lambda_permission" "signup_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.signup.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.url_shortener.execution_arn}/*/*"
}

# Lambda permission for API Gateway to invoke Login
resource "aws_lambda_permission" "login_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.login.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.url_shortener.execution_arn}/*/*"
}

# Refresh Token Lambda Function
resource "aws_lambda_function" "refresh_token" {
  filename         = data.archive_file.refresh_token_lambda.output_path
  function_name    = "${var.project_name}-${var.environment}-refresh-token"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.refresh_token_lambda.output_base64sha256
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      COGNITO_CLIENT_ID = aws_cognito_user_pool_client.url_shortener.id
      AWS_REGION_CUSTOM = var.aws_region
      ENVIRONMENT       = var.environment
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-refresh-token"
    }
  )
}

# CloudWatch Log Group for Refresh Token Lambda
resource "aws_cloudwatch_log_group" "refresh_token_logs" {
  name              = "/aws/lambda/${aws_lambda_function.refresh_token.function_name}"
  retention_in_days = 7

  tags = var.tags
}

# Lambda permission for API Gateway to invoke Refresh Token
resource "aws_lambda_permission" "refresh_token_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.refresh_token.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.url_shortener.execution_arn}/*/*"
}

# Forgot Password Lambda Function
resource "aws_lambda_function" "forgot_password" {
  filename         = data.archive_file.forgot_password_lambda.output_path
  function_name    = "${var.project_name}-${var.environment}-forgot-password"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.forgot_password_lambda.output_base64sha256
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      COGNITO_CLIENT_ID = aws_cognito_user_pool_client.url_shortener.id
      AWS_REGION_CUSTOM = var.aws_region
      ENVIRONMENT       = var.environment
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-forgot-password"
    }
  )
}

# Reset Password Lambda Function
resource "aws_lambda_function" "reset_password" {
  filename         = data.archive_file.reset_password_lambda.output_path
  function_name    = "${var.project_name}-${var.environment}-reset-password"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.reset_password_lambda.output_base64sha256
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      COGNITO_CLIENT_ID = aws_cognito_user_pool_client.url_shortener.id
      AWS_REGION_CUSTOM = var.aws_region
      ENVIRONMENT       = var.environment
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-reset-password"
    }
  )
}

# CloudWatch Log Group for Forgot Password Lambda
resource "aws_cloudwatch_log_group" "forgot_password_logs" {
  name              = "/aws/lambda/${aws_lambda_function.forgot_password.function_name}"
  retention_in_days = 7

  tags = var.tags
}

# CloudWatch Log Group for Reset Password Lambda
resource "aws_cloudwatch_log_group" "reset_password_logs" {
  name              = "/aws/lambda/${aws_lambda_function.reset_password.function_name}"
  retention_in_days = 7

  tags = var.tags
}

# Lambda permission for API Gateway to invoke Forgot Password
resource "aws_lambda_permission" "forgot_password_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.forgot_password.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.url_shortener.execution_arn}/*/*"
}

# Lambda permission for API Gateway to invoke Reset Password
resource "aws_lambda_permission" "reset_password_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.reset_password.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.url_shortener.execution_arn}/*/*"
}

# Verify Email Lambda Function
resource "aws_lambda_function" "verify_email" {
  filename         = data.archive_file.verify_email_lambda.output_path
  function_name    = "${var.project_name}-${var.environment}-verify-email"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.verify_email_lambda.output_base64sha256
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      COGNITO_CLIENT_ID = aws_cognito_user_pool_client.url_shortener.id
      AWS_REGION_CUSTOM = var.aws_region
      ENVIRONMENT       = var.environment
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-verify-email"
    }
  )
}

# Resend Verification Lambda Function
resource "aws_lambda_function" "resend_verification" {
  filename         = data.archive_file.resend_verification_lambda.output_path
  function_name    = "${var.project_name}-${var.environment}-resend-verification"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.resend_verification_lambda.output_base64sha256
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      COGNITO_CLIENT_ID = aws_cognito_user_pool_client.url_shortener.id
      AWS_REGION_CUSTOM = var.aws_region
      ENVIRONMENT       = var.environment
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-resend-verification"
    }
  )
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "verify_email_logs" {
  name              = "/aws/lambda/${aws_lambda_function.verify_email.function_name}"
  retention_in_days = 7

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "resend_verification_logs" {
  name              = "/aws/lambda/${aws_lambda_function.resend_verification.function_name}"
  retention_in_days = 7

  tags = var.tags
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "verify_email_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.verify_email.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.url_shortener.execution_arn}/*/*"
}

resource "aws_lambda_permission" "resend_verification_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.resend_verification.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.url_shortener.execution_arn}/*/*"
}

# Submit Feedback Lambda Function
resource "aws_lambda_function" "submit_feedback" {
  filename         = data.archive_file.submit_feedback_lambda.output_path
  function_name    = "${var.project_name}-${var.environment}-submit-feedback"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.submit_feedback_lambda.output_base64sha256
  runtime         = var.lambda_runtime
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory_size

  environment {
    variables = {
      FEEDBACK_TABLE_NAME = aws_dynamodb_table.feedback.name
      AWS_REGION_CUSTOM   = var.aws_region
      ENVIRONMENT         = var.environment
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-submit-feedback"
    }
  )
}

# CloudWatch Log Group for Submit Feedback Lambda
resource "aws_cloudwatch_log_group" "submit_feedback_logs" {
  name              = "/aws/lambda/${aws_lambda_function.submit_feedback.function_name}"
  retention_in_days = 7

  tags = var.tags
}

# Lambda permission for API Gateway to invoke Submit Feedback
resource "aws_lambda_permission" "submit_feedback_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.submit_feedback.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.url_shortener.execution_arn}/*/*"
}
