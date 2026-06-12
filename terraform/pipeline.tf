# S3 Bucket for CodePipeline artifacts
resource "aws_s3_bucket" "pipeline_artifacts" {
  bucket        = "elms-pipeline-artifacts-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = {
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CodeStar Connection to GitHub
resource "aws_codestarconnections_connection" "github" {
  name          = "elms-github-connection"
  provider_type = "GitHub"
}

# IAM Role for CodeBuild
resource "aws_iam_role" "codebuild_role" {
  name = "elms-codebuild-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# CodeBuild needs AdministratorAccess to run "terraform apply"
# since Terraform provisions DynamoDB, Lambda, Cognito, API Gateway, S3, CloudFront, and IAM roles.
resource "aws_iam_role_policy_attachment" "codebuild_admin" {
  role       = aws_iam_role.codebuild_role.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# IAM Role for CodePipeline
resource "aws_iam_role" "codepipeline_role" {
  name = "elms-codepipeline-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# IAM Policy for CodePipeline
resource "aws_iam_policy" "codepipeline_policy" {
  name        = "elms-codepipeline-policy"
  description = "Permissions for ELMS CodePipeline"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:GetBucketVersioning",
          "s3:PutObjectAcl",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.pipeline_artifacts.arn,
          "${aws_s3_bucket.pipeline_artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = [
          aws_s3_bucket.frontend.arn,
          "${aws_s3_bucket.frontend.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "codebuild:BatchGetBuilds",
          "codebuild:StartBuild"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "codestar-connections:UseConnection"
        ]
        Resource = aws_codestarconnections_connection.github.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "codepipeline_attach" {
  role       = aws_iam_role.codepipeline_role.name
  policy_arn = aws_iam_policy.codepipeline_policy.arn
}

# CodeBuild Project: Backend Deploy (Terraform Apply)
resource "aws_codebuild_project" "backend_deploy" {
  name          = "elms-backend-deploy"
  description   = "Builds backend and deploys AWS infrastructure via Terraform"
  build_timeout = "20"
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "ENVIRONMENT"
      value = var.environment
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "backend/buildspec.yml"
  }

  logs_config {
    cloudwatch_logs {
      group_name  = "/aws/codebuild/elms-backend-deploy"
      stream_name = "build-log"
    }
  }

  tags = {
    Environment = var.environment
  }
}

# CodeBuild Project: Frontend Build (React compilation)
resource "aws_codebuild_project" "frontend_build" {
  name          = "elms-frontend-build"
  description   = "Compiles React frontend application"
  build_timeout = "20"
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "ENVIRONMENT"
      value = var.environment
    }

    environment_variable {
      name  = "VITE_API_BASE_URL"
      value = aws_api_gateway_stage.stage.invoke_url
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "frontend/buildspec.yml"
  }

  logs_config {
    cloudwatch_logs {
      group_name  = "/aws/codebuild/elms-frontend-build"
      stream_name = "build-log"
    }
  }

  tags = {
    Environment = var.environment
  }
}

# CodeBuild Project: CloudFront Cache Invalidation
resource "aws_codebuild_project" "frontend_invalidate" {
  name          = "elms-frontend-invalidate"
  description   = "Invalidates CloudFront Cache after deployment"
  build_timeout = "5"
  service_role  = aws_iam_role.codebuild_role.arn

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "CLOUDFRONT_DISTRIBUTION_ID"
      value = aws_cloudfront_distribution.frontend.id
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = <<EOF
version: 0.2
phases:
  build:
    commands:
      - echo "Invalidating CloudFront CDN Cache..."
      - aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
EOF
  }

  logs_config {
    cloudwatch_logs {
      group_name  = "/aws/codebuild/elms-frontend-invalidate"
      stream_name = "build-log"
    }
  }

  tags = {
    Environment = var.environment
  }
}

# AWS CodePipeline Definition
resource "aws_codepipeline" "pipeline" {
  name     = "elms-ci-cd-pipeline"
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    location = aws_s3_bucket.pipeline_artifacts.bucket
    type     = "S3"
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        ConnectionArn    = aws_codestarconnections_connection.github.arn
        FullRepositoryId = var.github_repo
        BranchName       = var.github_branch
      }
    }
  }

  stage {
    name = "DeployBackend"

    action {
      name             = "DeployBackend"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["source_output"]
      output_artifacts = ["backend_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.backend_deploy.name
      }
    }
  }

  stage {
    name = "BuildFrontend"

    action {
      name             = "BuildFrontend"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["source_output"]
      output_artifacts = ["frontend_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.frontend_build.name
      }
    }
  }

  stage {
    name = "DeployFrontend"

    action {
      name             = "DeployToS3"
      category         = "Deploy"
      owner            = "AWS"
      provider         = "S3"
      input_artifacts  = ["frontend_output"]
      version          = "1"
      run_order        = 1

      configuration = {
        BucketName = aws_s3_bucket.frontend.id
        Extract    = "true"
      }
    }

    action {
      name             = "InvalidateCloudFront"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["source_output"]
      version          = "1"
      run_order        = 2

      configuration = {
        ProjectName = aws_codebuild_project.frontend_invalidate.name
      }
    }
  }
}
