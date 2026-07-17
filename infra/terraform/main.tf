terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state in S3 with a DynamoDB lock table.
  # Create the bucket + table once, out-of-band, before `terraform init`.
  backend "s3" {
    bucket         = "learnhub-terraform-state"
    key            = "infra/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "learnhub-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.env
      ManagedBy   = "terraform"
    }
  }
}

# Convenience locals used across the config.
locals {
  name       = "${var.project}-${var.env}"
  is_prod    = var.env == "prod"
  azs        = slice(data.aws_availability_zones.available.names, 0, 2)
  common_tags = {
    Project     = var.project
    Environment = var.env
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}
