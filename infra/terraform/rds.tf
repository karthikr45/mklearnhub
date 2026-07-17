resource "aws_db_subnet_group" "main" {
  name       = "${local.name}-db-subnets"
  subnet_ids = aws_subnet.private[*].id
  tags       = { Name = "${local.name}-db-subnets" }
}

resource "aws_db_parameter_group" "postgres" {
  name        = "${local.name}-pg16"
  family      = "postgres16"
  description = "LearnHub PostgreSQL 16 parameters"

  parameter {
    name  = "log_min_duration_statement"
    value = "500"
  }

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
}

resource "aws_db_instance" "postgres" {
  identifier     = "${local.name}-postgres"
  engine         = "postgres"
  engine_version = "16"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 4
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "learnhub_db"
  username = var.db_username
  password = var.db_password
  port     = 5432

  # Multi-AZ only in prod for cost control.
  multi_az = local.is_prod

  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.postgres.name
  vpc_security_group_ids = [aws_security_group.db.id]

  backup_retention_period = local.is_prod ? 30 : 7
  backup_window           = "18:00-19:00"
  maintenance_window      = "Mon:19:30-Mon:20:30"

  deletion_protection       = local.is_prod
  skip_final_snapshot       = !local.is_prod
  final_snapshot_identifier = local.is_prod ? "${local.name}-postgres-final" : null

  performance_insights_enabled = local.is_prod
  auto_minor_version_upgrade   = true

  tags = { Name = "${local.name}-postgres" }
}
