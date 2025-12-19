resource "aws_dynamodb_table" "url_mappings" {
  name           = var.dynamodb_table_name
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "ShortCode"

  # Primary key attribute
  attribute {
    name = "ShortCode"
    type = "S"
  }

  # GSI attributes
  attribute {
    name = "UserId"
    type = "S"
  }

  attribute {
    name = "CreatedAt"
    type = "N"
  }

  # Global Secondary Index for querying user's links
  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "UserId"
    range_key       = "CreatedAt"
    projection_type = "ALL"
  }

  # Enable point-in-time recovery for data protection
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
