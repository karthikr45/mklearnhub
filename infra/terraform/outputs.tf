output "db_endpoint" {
  description = "RDS PostgreSQL connection endpoint (host:port)."
  value       = aws_db_instance.postgres.endpoint
}

output "redis_endpoint" {
  description = "ElastiCache Redis primary endpoint."
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "alb_dns_name" {
  description = "Public DNS name of the application load balancer."
  value       = aws_lb.main.dns_name
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain name."
  value       = aws_cloudfront_distribution.web.domain_name
}

output "media_bucket_name" {
  description = "Name of the S3 media bucket."
  value       = aws_s3_bucket.media.bucket
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.main.name
}

output "vpc_id" {
  description = "VPC id."
  value       = aws_vpc.main.id
}
