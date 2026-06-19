terraform {
  backend "s3" {
    bucket  = "elms-terraform-state-sathwik-12345"
    key     = "state/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}
