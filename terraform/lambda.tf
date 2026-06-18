# Archive files for Lambdas
data "archive_file" "auth_trigger_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/auth-trigger"
  output_path = "${path.module}/dist/auth-trigger.zip"
}

data "archive_file" "leaves_handler_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/leaves-handler"
  output_path = "${path.module}/dist/leaves-handler.zip"
}

data "archive_file" "users_handler_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/users-handler"
  output_path = "${path.module}/dist/users-handler.zip"
}

data "archive_file" "otp_handler_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/otp-handler"
  output_path = "${path.module}/dist/otp-handler.zip"
}

data "archive_file" "define_challenge_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/cognito-triggers/define-challenge"
  output_path = "${path.module}/dist/define-challenge.zip"
}

data "archive_file" "create_challenge_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/cognito-triggers/create-challenge"
  output_path = "${path.module}/dist/create-challenge.zip"
}

data "archive_file" "verify_challenge_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/cognito-triggers/verify-challenge"
  output_path = "${path.module}/dist/verify-challenge.zip"
}

# IAM Role Policy Document for Lambda Assume Role
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# IAM Role for Auth Trigger Lambda
resource "aws_iam_role" "auth_trigger_role" {
  name               = "elms-auth-trigger-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

# IAM Policy for Auth Trigger (Write to Employees Table)
resource "aws_iam_policy" "auth_trigger_policy" {
  name        = "elms-auth-trigger-policy"
  description = "Permissions for ELMS Auth Trigger Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.employees.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "auth_trigger_attach" {
  role       = aws_iam_role.auth_trigger_role.name
  policy_arn = aws_iam_policy.auth_trigger_policy.arn
}

# IAM Role for Leaves Handler Lambda
resource "aws_iam_role" "leaves_handler_role" {
  name               = "elms-leaves-handler-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

# IAM Policy for Leaves Handler (Read/Write LeaveRequests Table)
resource "aws_iam_policy" "leaves_handler_policy" {
  name        = "elms-leaves-handler-policy"
  description = "Permissions for ELMS Leaves Handler Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.leave_requests.arn,
          "${aws_dynamodb_table.leave_requests.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "leaves_handler_attach" {
  role       = aws_iam_role.leaves_handler_role.name
  policy_arn = aws_iam_policy.leaves_handler_policy.arn
}

# IAM Role for Users Handler Lambda
resource "aws_iam_role" "users_handler_role" {
  name               = "elms-users-handler-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

# IAM Policy for Users Handler (Read/Write Employees Table)
resource "aws_iam_policy" "users_handler_policy" {
  name        = "elms-users-handler-policy"
  description = "Permissions for ELMS Users Handler Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.employees.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "users_handler_attach" {
  role       = aws_iam_role.users_handler_role.name
  policy_arn = aws_iam_policy.users_handler_policy.arn
}

# IAM Role for OTP Handler Lambda
resource "aws_iam_role" "otp_handler_role" {
  name               = "elms-otp-handler-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

# IAM Policy for OTP Handler (Read/Write Otps and Employees Tables, SES SendEmail)
resource "aws_iam_policy" "otp_handler_policy" {
  name        = "elms-otp-handler-policy"
  description = "Permissions for ELMS OTP Handler Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.employees.arn,
          aws_dynamodb_table.otps.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "otp_handler_attach" {
  role       = aws_iam_role.otp_handler_role.name
  policy_arn = aws_iam_policy.otp_handler_policy.arn
}


# Lambda Functions
resource "aws_lambda_function" "auth_trigger" {
  filename         = data.archive_file.auth_trigger_zip.output_path
  function_name    = "AuthTriggerLambda"
  role             = aws_iam_role.auth_trigger_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  source_code_hash = data.archive_file.auth_trigger_zip.output_base64sha256

  environment {
    variables = {
      USERS_TABLE = aws_dynamodb_table.employees.name
    }
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_lambda_function" "leaves_handler" {
  filename         = data.archive_file.leaves_handler_zip.output_path
  function_name    = "LeavesHandlerLambda"
  role             = aws_iam_role.leaves_handler_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  source_code_hash = data.archive_file.leaves_handler_zip.output_base64sha256

  environment {
    variables = {
      LEAVES_TABLE = aws_dynamodb_table.leave_requests.name
    }
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_lambda_function" "users_handler" {
  filename         = data.archive_file.users_handler_zip.output_path
  function_name    = "UsersHandlerLambda"
  role             = aws_iam_role.users_handler_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  source_code_hash = data.archive_file.users_handler_zip.output_base64sha256

  environment {
    variables = {
      USERS_TABLE = aws_dynamodb_table.employees.name
    }
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_lambda_function" "otp_handler" {
  filename         = data.archive_file.otp_handler_zip.output_path
  function_name    = "OtpHandlerLambda"
  role             = aws_iam_role.otp_handler_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  source_code_hash = data.archive_file.otp_handler_zip.output_base64sha256

  environment {
    variables = {
      OTP_TABLE   = aws_dynamodb_table.otps.name
      USERS_TABLE = aws_dynamodb_table.employees.name
      JWT_SECRET  = var.jwt_secret
      SES_SENDER  = var.ses_sender
    }
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_ses_email_identity" "ses_sender" {
  email = var.ses_sender
}

# IAM Role for Cognito Triggers
resource "aws_iam_role" "cognito_triggers_role" {
  name               = "elms-cognito-triggers-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_policy" "cognito_triggers_policy" {
  name        = "elms-cognito-triggers-policy"
  description = "Permissions for ELMS Cognito Custom Auth Triggers"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cognito_triggers_attach" {
  role       = aws_iam_role.cognito_triggers_role.name
  policy_arn = aws_iam_policy.cognito_triggers_policy.arn
}

resource "aws_lambda_function" "define_challenge" {
  filename         = data.archive_file.define_challenge_zip.output_path
  function_name    = "DefineChallengeLambda"
  role             = aws_iam_role.cognito_triggers_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  source_code_hash = data.archive_file.define_challenge_zip.output_base64sha256

  tags = {
    Environment = var.environment
  }
}

resource "aws_lambda_function" "create_challenge" {
  filename         = data.archive_file.create_challenge_zip.output_path
  function_name    = "CreateChallengeLambda"
  role             = aws_iam_role.cognito_triggers_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  source_code_hash = data.archive_file.create_challenge_zip.output_base64sha256

  environment {
    variables = {
      SES_SENDER = var.ses_sender
    }
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_lambda_function" "verify_challenge" {
  filename         = data.archive_file.verify_challenge_zip.output_path
  function_name    = "VerifyChallengeLambda"
  role             = aws_iam_role.cognito_triggers_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  source_code_hash = data.archive_file.verify_challenge_zip.output_base64sha256

  tags = {
    Environment = var.environment
  }
}
