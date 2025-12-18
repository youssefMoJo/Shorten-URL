variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "ca-central-1"
}

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table for URL mappings"
  type        = string
  default     = "shortenurl-dev"
}

variable "lambda_runtime" {
  description = "Lambda function runtime"
  type        = string
  default     = "nodejs20.x"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 256
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "Shorten-URL"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "Shorten URL"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}
