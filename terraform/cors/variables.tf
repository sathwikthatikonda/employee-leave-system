variable "rest_api_id" {
  type        = string
  description = "The REST API ID"
}

variable "resource_id" {
  type        = string
  description = "The API Resource ID"
}

variable "allow_origin" {
  type        = string
  description = "Access-Control-Allow-Origin header value"
  default     = "*"
}

variable "allow_methods" {
  type        = string
  description = "Access-Control-Allow-Methods header value"
  default     = "GET,POST,PUT,DELETE,OPTIONS"
}

variable "allow_headers" {
  type        = string
  description = "Access-Control-Allow-Headers header value"
  default     = "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"
}
