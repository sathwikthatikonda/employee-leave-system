variable "aws_region" {
  type        = string
  description = "Target AWS region for deploying resources"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Application environment name"
  default     = "prod"
}

variable "jwt_secret" {
  type        = string
  description = "Secret key for JWT generation in OTP handler"
  default     = "super-secret-chronos-key-12345"
  sensitive   = true
}

variable "ses_sender" {
  type        = string
  description = "SES verified email address to send OTPs from"
  default     = "sathwikthatikonda5@gmail.com"
}

variable "github_repo" {
  type        = string
  description = "The GitHub repository in the format owner/repo"
  default     = "sathwikthatikonda/employee-leave-system"
}

variable "github_branch" {
  type        = string
  description = "The branch to trigger the pipeline"
  default     = "main"
}

