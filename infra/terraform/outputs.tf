output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "msk_bootstrap_brokers_tls" {
  value     = aws_msk_cluster.kafka.bootstrap_brokers_tls
  sensitive = true
}

output "redis_endpoint" {
  value = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "rds_endpoint" {
  value     = aws_rds_cluster.payments.endpoint
  sensitive = true
}
