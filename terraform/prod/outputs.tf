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

output "signup_lambda_function_name" {
  description = "The name of the signup Lambda function"
  value       = aws_lambda_function.signup.function_name
}

output "signup_lambda_function_arn" {
  description = "The ARN of the signup Lambda function"
  value       = aws_lambda_function.signup.arn
}

output "login_lambda_function_name" {
  description = "The name of the login Lambda function"
  value       = aws_lambda_function.login.function_name
}

output "login_lambda_function_arn" {
  description = "The ARN of the login Lambda function"
  value       = aws_lambda_function.login.arn
}

output "lambda_execution_role_arn" {
  description = "The ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_execution_role.arn
}

output "api_endpoints" {
  description = "API endpoints for the URL shortener service"
  value = {
    signup   = "${aws_api_gateway_stage.url_shortener.invoke_url}/auth/signup"
    login    = "${aws_api_gateway_stage.url_shortener.invoke_url}/auth/login"
    shorten  = "${aws_api_gateway_stage.url_shortener.invoke_url}/shorten"
    expand   = "${aws_api_gateway_stage.url_shortener.invoke_url}/expand/{short}"
    me_links = "${aws_api_gateway_stage.url_shortener.invoke_url}/me/links"
  }
}

output "cloudwatch_log_groups" {
  description = "CloudWatch log groups for monitoring"
  value = {
    shorten_lambda        = aws_cloudwatch_log_group.shorten_url_logs.name
    expand_lambda         = aws_cloudwatch_log_group.expand_url_logs.name
    get_user_links_lambda = aws_cloudwatch_log_group.get_user_links_logs.name
    signup_lambda         = aws_cloudwatch_log_group.signup_logs.name
    login_lambda          = aws_cloudwatch_log_group.login_logs.name
    api_gateway           = aws_cloudwatch_log_group.api_gateway_logs.name
  }
}

output "cognito_user_pool_id" {
  description = "The ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.url_shortener.id
}

output "cognito_user_pool_arn" {
  description = "The ARN of the Cognito User Pool"
  value       = aws_cognito_user_pool.url_shortener.arn
}

output "cognito_user_pool_client_id" {
  description = "The ID of the Cognito User Pool Client"
  value       = aws_cognito_user_pool_client.url_shortener.id
}

output "cognito_domain" {
  description = "The Cognito hosted UI domain"
  value       = aws_cognito_user_pool_domain.url_shortener.domain
}

output "cognito_hosted_ui_url" {
  description = "The Cognito hosted UI URL for sign-in"
  value       = "https://${aws_cognito_user_pool_domain.url_shortener.domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "environment" {
  description = "The environment name"
  value       = var.environment
}

output "region" {
  description = "The AWS region"
  value       = var.aws_region
}

output "custom_domain_name" {
  description = "The custom domain name for the API"
  value       = aws_api_gateway_domain_name.prod_domain.domain_name
}

output "custom_domain_url" {
  description = "The custom domain URL for the API"
  value       = "https://${aws_api_gateway_domain_name.prod_domain.domain_name}"
}

output "custom_api_endpoints" {
  description = "API endpoints using the custom domain"
  value = {
    signup   = "https://${aws_api_gateway_domain_name.prod_domain.domain_name}/auth/signup"
    login    = "https://${aws_api_gateway_domain_name.prod_domain.domain_name}/auth/login"
    shorten  = "https://${aws_api_gateway_domain_name.prod_domain.domain_name}/shorten"
    expand   = "https://${aws_api_gateway_domain_name.prod_domain.domain_name}/expand/{short}"
    me_links = "https://${aws_api_gateway_domain_name.prod_domain.domain_name}/me/links"
  }
}
