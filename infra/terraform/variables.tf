variable "aws_region" {
  default = "us-east-1"
}

variable "cluster_name" {
  default = "ride-platform"
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

variable "db_password" {
  description = "RDS master password"
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  sensitive   = true
}
