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
