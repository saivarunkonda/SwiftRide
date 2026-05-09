terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.30"
    }
  }
  # Remote state — create this S3 bucket + DynamoDB table manually first
  backend "s3" {
    bucket         = "ride-platform-tfstate"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "ride-platform-tfstate-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}
