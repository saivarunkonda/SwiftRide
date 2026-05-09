# Aurora PostgreSQL for payments DB
resource "aws_rds_cluster" "payments" {
  cluster_identifier      = "${var.cluster_name}-payments"
  engine                  = "aurora-postgresql"
  engine_version          = "15.4"
  database_name           = "payments"
  master_username         = "postgres"
  master_password         = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.payments.name
  vpc_security_group_ids  = [aws_security_group.rds.id]

  backup_retention_period = 7
  deletion_protection     = true
  storage_encrypted       = true

  serverlessv2_scaling_configuration {
    min_capacity = 0.5
    max_capacity = 16
  }
}

resource "aws_rds_cluster_instance" "payments" {
  count              = 2   # 1 writer + 1 reader
  identifier         = "${var.cluster_name}-payments-${count.index}"
  cluster_identifier = aws_rds_cluster.payments.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.payments.engine
  engine_version     = aws_rds_cluster.payments.engine_version
}

resource "aws_db_subnet_group" "payments" {
  name       = "${var.cluster_name}-payments-subnet"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_security_group" "rds" {
  name   = "${var.cluster_name}-rds-sg"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
}
