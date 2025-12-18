resource "aws_dynamodb_table" "url_mappings" {
  name           = var.dynamodb_table_name
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "ShortenedURL"

  attribute {
    name = "ShortenedURL"
    type = "S"
  }

  # Enable point-in-time recovery for data protection in dev
  point_in_time_recovery {
    enabled = true
  }

  # Enable TTL for automatic cleanup of old URLs (optional)
  ttl {
    attribute_name = "ExpirationTime"
    enabled        = false  # Set to true if you want to implement URL expiration
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-dynamodb-table"
    }
  )
}
