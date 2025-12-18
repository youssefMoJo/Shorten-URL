# Archive the Lambda functions
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
