output "user_pool_id" {
  description = "The ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.user_pool.id
}

output "user_pool_client_id" {
  description = "The ID of the Cognito User Pool Client"
  value       = aws_cognito_user_pool_client.user_pool_client.id
}

output "api_gateway_url" {
  description = "The URL of the API Gateway Stage endpoint"
  value       = aws_api_gateway_stage.stage.invoke_url
}

output "cloudfront_url" {
  description = "The domain name of the CloudFront Distribution hosting the frontend"
  value       = aws_cloudfront_distribution.frontend.domain_name
}
