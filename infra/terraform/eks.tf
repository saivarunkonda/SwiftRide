module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.2.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.29"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # Public endpoint for kubectl access (restrict to your IP in prod)
  cluster_endpoint_public_access = true

  eks_managed_node_groups = {
    # General workloads
    general = {
      instance_types = ["m5.xlarge"]
      min_size       = 2
      max_size       = 10
      desired_size   = 3
      labels = { role = "general" }
    }
    # Kafka Streams / high-memory workloads
    memory_optimized = {
      instance_types = ["r5.xlarge"]
      min_size       = 1
      max_size       = 5
      desired_size   = 2
      labels = { role = "memory-optimized" }
    }
  }

  # Enable IRSA (IAM Roles for Service Accounts) — pods get AWS permissions without static keys
  enable_irsa = true
}

# Cluster Autoscaler IAM policy
resource "aws_iam_role_policy_attachment" "cluster_autoscaler" {
  role       = module.eks.eks_managed_node_groups["general"].iam_role_name
  policy_arn = "arn:aws:iam::aws:policy/AutoScalingFullAccess"
}
