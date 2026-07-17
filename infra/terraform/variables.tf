variable "region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "ap-south-1"
}

variable "env" {
  description = "Environment name (dev | staging | prod). Drives multi-AZ + sizing."
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.env)
    error_message = "env must be one of: dev, staging, prod."
  }
}

variable "project" {
  description = "Project name used as a resource name prefix."
  type        = string
  default     = "learnhub"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "domain" {
  description = "Primary domain served by CloudFront / ALB."
  type        = string
  default     = "app.learnhub.com"
}

variable "db_instance_class" {
  description = "RDS instance class for PostgreSQL."
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GiB."
  type        = number
  default     = 50
}

variable "db_username" {
  description = "Master username for the RDS instance."
  type        = string
  default     = "learnhub"
}

variable "db_password" {
  description = "Master password for the RDS instance. Supply via TF_VAR_db_password / secret store."
  type        = string
  sensitive   = true
}

variable "redis_node_type" {
  description = "ElastiCache node type for Redis."
  type        = string
  default     = "cache.t3.micro"
}

variable "api_image" {
  description = "Container image (repo:tag) for the API/worker ECS tasks."
  type        = string
  default     = "ghcr.io/learnhub/api:1.0.0"
}

variable "api_desired_count" {
  description = "Desired number of API tasks."
  type        = number
  default     = 2
}

variable "acm_certificate_arn" {
  description = "ACM cert ARN (us-east-1) for CloudFront + the ALB HTTPS listener."
  type        = string
  default     = ""
}
