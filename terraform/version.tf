terraform {
  backend "s3" {
    bucket  = "employee-leave-1"
    key     = "state/terraform.tfstate"
    region  = "ap-south-1"
    encrypt = true
  }
}
