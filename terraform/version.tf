terraform {
  backend "s3" {
    bucket  = "employee-leave-1"
    key     = "state/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }
}
