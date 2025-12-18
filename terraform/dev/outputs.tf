output "api_gateway_url" {
  description = "The URL of the API Gateway"
  value       = "${aws_api_gateway_stage.url_shortener.invoke_url}"
}

output "api_gateway_id" {
  description = "The ID of the API Gateway"
  value       = aws_api_gateway_rest_api.url_shortener.id
}

output "api_gateway_stage_name" {
  description = "The name of the API Gateway stage"
  value       = aws_api_gateway_stage.url_shortener.stage_name
}

output "dynamodb_table_name" {
  description = "The name of the DynamoDB table"
  value       = aws_dynamodb_table.url_mappings.name
}

output "dynamodb_table_arn" {
  description = "The ARN of the DynamoDB table"
  value       = aws_dynamodb_table.url_mappings.arn
}

output "shorten_lambda_function_name" {
  description = "The name of the shorten URL Lambda function"
  value       = aws_lambda_function.shorten_url.function_name
}

output "shorten_lambda_function_arn" {
  description = "The ARN of the shorten URL Lambda function"
  value       = aws_lambda_function.shorten_url.arn
}

output "expand_lambda_function_name" {
  description = "The name of the expand URL Lambda function"
  value       = aws_lambda_function.expand_url.function_name
}

output "expand_lambda_function_arn" {
  description = "The ARN of the expand URL Lambda function"
  value       = aws_lambda_function.expand_url.arn
}

output "lambda_execution_role_arn" {
  description = "The ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_execution_role.arn
}

output "api_endpoints" {
  description = "API endpoints for the URL shortener service"
  value = {
    shorten = "${aws_api_gateway_stage.url_shortener.invoke_url}/shorten"
    expand  = "${aws_api_gateway_stage.url_shortener.invoke_url}/expand/{short}"
  }
}

output "cloudwatch_log_groups" {
  description = "CloudWatch log groups for monitoring"
  value = {
    shorten_lambda = aws_cloudwatch_log_group.shorten_url_logs.name
    expand_lambda  = aws_cloudwatch_log_group.expand_url_logs.name
    api_gateway    = aws_cloudwatch_log_group.api_gateway_logs.name
  }
}

output "environment" {
  description = "The environment name"
  value       = var.environment
}

output "region" {
  description = "The AWS region"
  value       = var.aws_region
}
