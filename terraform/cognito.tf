resource "aws_cognito_user_pool" "user_pool" {
  name                     = "ELMS-UserPool"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 0
      max_length = 2048
    }
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 0
      max_length = 2048
    }
  }

  schema {
    name                = "role"
    attribute_data_type = "String"
    required            = false
    mutable             = true

    string_attribute_constraints {
      min_length = 0
      max_length = 2048
    }
  }

  lambda_config {
    post_confirmation              = aws_lambda_function.auth_trigger.arn
    define_auth_challenge          = aws_lambda_function.define_challenge.arn
    create_auth_challenge          = aws_lambda_function.create_challenge.arn
    verify_auth_challenge_response = aws_lambda_function.verify_challenge.arn
  }

  tags = {
    Environment = var.environment
  }

  # Ensure Lambda permission is created before configuring the trigger
  depends_on = [
    aws_lambda_permission.cognito_post_confirmation,
    aws_lambda_permission.cognito_define_challenge,
    aws_lambda_permission.cognito_create_challenge,
    aws_lambda_permission.cognito_verify_challenge
  ]
}

resource "aws_cognito_user_pool_client" "user_pool_client" {
  name            = "ElmsUserPoolClient"
  user_pool_id    = aws_cognito_user_pool.user_pool.id
  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_CUSTOM_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
}

resource "aws_lambda_permission" "cognito_post_confirmation" {
  statement_id  = "AllowExecutionFromCognito"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_trigger.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = "arn:aws:cognito-idp:${var.aws_region}:${data.aws_caller_identity.current.account_id}:userpool/*"
}

resource "aws_lambda_permission" "cognito_define_challenge" {
  statement_id  = "AllowExecutionFromCognitoDefineChallenge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.define_challenge.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = "arn:aws:cognito-idp:${var.aws_region}:${data.aws_caller_identity.current.account_id}:userpool/*"
}

resource "aws_lambda_permission" "cognito_create_challenge" {
  statement_id  = "AllowExecutionFromCognitoCreateChallenge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_challenge.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = "arn:aws:cognito-idp:${var.aws_region}:${data.aws_caller_identity.current.account_id}:userpool/*"
}

resource "aws_lambda_permission" "cognito_verify_challenge" {
  statement_id  = "AllowExecutionFromCognitoVerifyChallenge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.verify_challenge.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = "arn:aws:cognito-idp:${var.aws_region}:${data.aws_caller_identity.current.account_id}:userpool/*"
}
