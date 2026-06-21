resource "aws_dynamodb_table" "employees" {
  name         = "Employees"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "employeeId"

  attribute {
    name = "employeeId"
    type = "S"
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "leave_requests" {
  name         = "LeaveRequests"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "requestId"

  attribute {
    name = "requestId"
    type = "S"
  }

  attribute {
    name = "employeeId"
    type = "S"
  }

  global_secondary_index {
    name            = "EmployeeIndex"
    hash_key        = "employeeId"
    projection_type = "ALL"
  }

  tags = {
    Environment = var.environment
  }
}

