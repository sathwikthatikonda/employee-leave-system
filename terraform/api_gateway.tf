resource "aws_api_gateway_rest_api" "api" {
  name        = "ELMS Service API"
  description = "API services for Employee Leave Management System."

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# --- RESOURCES ---

# /leaves
resource "aws_api_gateway_resource" "leaves" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "leaves"
}

# /leaves/{id}
resource "aws_api_gateway_resource" "leaves_id" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.leaves.id
  path_part   = "{id}"
}

# /leaves/{id}/status
resource "aws_api_gateway_resource" "leaves_status" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.leaves_id.id
  path_part   = "status"
}

# /users
resource "aws_api_gateway_resource" "users" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "users"
}

# /users/{id}
resource "aws_api_gateway_resource" "users_id" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.users.id
  path_part   = "{id}"
}

# /users/{id}/balances
resource "aws_api_gateway_resource" "users_balances" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.users_id.id
  path_part   = "balances"
}


# --- METHODS & INTEGRATIONS ---

# Helper macro-like configuration for lambda integrations
# 1. /leaves POST (leavesHandler)
resource "aws_api_gateway_method" "leaves_post" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.leaves.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "leaves_post" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.leaves.id
  http_method             = aws_api_gateway_method.leaves_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.leaves_handler.invoke_arn
}

# 2. /leaves GET (leavesHandler)
resource "aws_api_gateway_method" "leaves_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.leaves.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "leaves_get" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.leaves.id
  http_method             = aws_api_gateway_method.leaves_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.leaves_handler.invoke_arn
}

# 3. /leaves/{id}/status PUT (leavesHandler)
resource "aws_api_gateway_method" "leaves_status_put" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.leaves_status.id
  http_method   = "PUT"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "leaves_status_put" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.leaves_status.id
  http_method             = aws_api_gateway_method.leaves_status_put.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.leaves_handler.invoke_arn
}

# 4. /users GET (usersHandler)
resource "aws_api_gateway_method" "users_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.users.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "users_get" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.users.id
  http_method             = aws_api_gateway_method.users_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.users_handler.invoke_arn
}

# 5. /users/{id}/balances PUT (usersHandler)
resource "aws_api_gateway_method" "users_balances_put" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.users_balances.id
  http_method   = "PUT"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "users_balances_put" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.users_balances.id
  http_method             = aws_api_gateway_method.users_balances_put.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.users_handler.invoke_arn
}


# --- CORS CONFIGURATION (OPTIONS Methods) ---

module "cors_leaves" {
  source      = "./cors"
  resource_id = aws_api_gateway_resource.leaves.id
  rest_api_id = aws_api_gateway_rest_api.api.id
}

module "cors_leaves_status" {
  source      = "./cors"
  resource_id = aws_api_gateway_resource.leaves_status.id
  rest_api_id = aws_api_gateway_rest_api.api.id
}

module "cors_users" {
  source      = "./cors"
  resource_id = aws_api_gateway_resource.users.id
  rest_api_id = aws_api_gateway_rest_api.api.id
}

module "cors_users_balances" {
  source      = "./cors"
  resource_id = aws_api_gateway_resource.users_balances.id
  rest_api_id = aws_api_gateway_rest_api.api.id
}



# --- LAMBDA PERMISSIONS FOR API GATEWAY ---

resource "aws_lambda_permission" "apigw_leaves" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.leaves_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*"
}

resource "aws_lambda_permission" "apigw_users" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.users_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*"
}


# --- DEPLOYMENT & STAGE ---

resource "aws_api_gateway_deployment" "deployment" {
  depends_on = [
    aws_api_gateway_integration.leaves_post,
    aws_api_gateway_integration.leaves_get,
    aws_api_gateway_integration.leaves_status_put,
    aws_api_gateway_integration.users_get,
    aws_api_gateway_integration.users_balances_put
  ]

  rest_api_id = aws_api_gateway_rest_api.api.id

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "stage" {
  deployment_id = aws_api_gateway_deployment.deployment.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = var.environment
}
