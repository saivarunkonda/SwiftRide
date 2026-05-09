# External Platform Configuration

Everything you need to set up manually on external platforms before deploying.

---

## 1. AWS — Required Setup

### IAM
- Create an IAM user or role for Terraform with these policies:
  - `AmazonEKSFullAccess`
  - `AmazonMSKFullAccess`
  - `AmazonElastiCacheFullAccess`
  - `AmazonRDSFullAccess`
  - `AmazonSNSFullAccess`
  - `AmazonVPCFullAccess`
  - `IAMFullAccess`
- Export credentials before running Terraform:
  ```bash
  export AWS_ACCESS_KEY_ID=...
  export AWS_SECRET_ACCESS_KEY=...
  export AWS_REGION=us-east-1
  ```

### Terraform State Backend (create once manually)
```bash
# Create S3 bucket for state
aws s3api create-bucket --bucket ride-platform-tfstate --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket ride-platform-tfstate \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name ride-platform-tfstate-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### ECR — Container Registries
Create one repo per service:
```bash
aws ecr create-repository --repository-name location-service
aws ecr create-repository --repository-name trip-matching-service
aws ecr create-repository --repository-name surge-pricing-service
aws ecr create-repository --repository-name notification-service
aws ecr create-repository --repository-name payment-service
```
Then replace `<ECR_REPO>` in k8s manifests with your account ECR URL:
`<account_id>.dkr.ecr.us-east-1.amazonaws.com`

### SNS — Mobile Push (FCM/APNS)
After Terraform creates the SNS topics:
1. Go to AWS Console → SNS → Topics → `rider-notifications`
2. Create a subscription:
   - Protocol: `Application` (for mobile push)
   - Endpoint: your FCM/APNS platform application ARN
3. Repeat for `driver-notifications`
4. Update `application.yml` env vars with the topic ARNs from Terraform output

### Secrets Manager (recommended over env vars in prod)
Store sensitive values:
```bash
aws secretsmanager create-secret --name ride-platform/stripe-secret-key \
  --secret-string '{"key":"sk_live_..."}'

aws secretsmanager create-secret --name ride-platform/db-password \
  --secret-string '{"password":"..."}'
```

---

## 2. Stripe — Required Setup

1. Create account at https://stripe.com
2. Go to Developers → API Keys
   - Copy **Secret key** (`sk_live_...` or `sk_test_...` for dev)
   - Set as env var: `STRIPE_SECRET_KEY`
3. Webhook setup:
   - Go to Developers → Webhooks → Add endpoint
   - URL: `https://your-domain.com/v1/payments/webhook`
   - Events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.dispute.created`
   - Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET`
4. For each rider, create a Stripe Customer and store the `cus_...` ID in your user service
   - This is the `stripeCustomerId` field in the charge request

---

## 3. Firebase (FCM) — Push Notifications

1. Create project at https://console.firebase.google.com
2. Go to Project Settings → Cloud Messaging
3. Copy **Server Key**
4. In AWS SNS Console:
   - Go to Mobile → Push Notifications → Create platform application
   - Platform: `FCM`
   - Paste the Server Key
   - Copy the Platform Application ARN
5. Use this ARN when creating SNS subscriptions for mobile endpoints

---

## 4. Apple Push Notifications (APNS) — iOS

1. In Apple Developer Console → Certificates → create an APNs key (.p8 file)
2. Note your Team ID and Key ID
3. In AWS SNS Console:
   - Create platform application → Platform: `APNS`
   - Upload the .p8 certificate
   - Copy the Platform Application ARN

---

## 5. Elasticsearch — Index Setup

After `docker compose up` or after EKS deployment, create the driver_locations index mapping:

```bash
curl -X PUT http://localhost:9200/driver_locations \
  -H "Content-Type: application/json" \
  -d '{
    "mappings": {
      "properties": {
        "driverId":     { "type": "keyword" },
        "location":     { "type": "geo_point" },
        "status":       { "type": "keyword" },
        "rating":       { "type": "double" },
        "speed":        { "type": "double" },
        "heading":      { "type": "double" },
        "lastUpdated":  { "type": "date" }
      }
    }
  }'
```

---

## 6. kubectl — Connect to EKS

After Terraform apply:
```bash
aws eks update-kubeconfig --region us-east-1 --name ride-platform

# Verify
kubectl get nodes

# Apply manifests
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/
```

---

## 7. Kubernetes Secrets

Create secrets in the cluster before deploying services:
```bash
kubectl create secret generic rds-secret \
  --from-literal=host="<AURORA_ENDPOINT>" \
  --from-literal=username="postgres" \
  --from-literal=password="<DB_PASSWORD>" \
  -n ride-platform

kubectl create secret generic kafka-secret \
  --from-literal=brokers="<MSK_BOOTSTRAP_BROKERS_TLS>" \
  -n ride-platform

kubectl create secret generic redis-secret \
  --from-literal=addr="<ELASTICACHE_ENDPOINT>:6379" \
  --from-literal=host="<ELASTICACHE_ENDPOINT>" \
  -n ride-platform

kubectl create secret generic stripe-secret \
  --from-literal=secret-key="sk_live_..." \
  --from-literal=webhook-secret="whsec_..." \
  -n ride-platform

kubectl create secret generic jwt-secret \
  --from-literal=secret="<your-jwt-signing-secret-min-32-chars>" \
  -n ride-platform

kubectl create configmap app-config \
  --from-literal=cassandra_host="<CASSANDRA_HOST>" \
  --from-literal=elasticsearch_uri="http://<ES_HOST>:9200" \
  --from-literal=cognito_jwks_uri="https://cognito-idp.us-east-1.amazonaws.com/<POOL_ID>/.well-known/jwks.json" \
  --from-literal=sns_topic_arn_rider="<RIDER_TOPIC_ARN>" \
  --from-literal=sns_topic_arn_driver="<DRIVER_TOPIC_ARN>" \
  -n ride-platform
```

---

## 9. GitHub Actions — Required Secrets

In your GitHub repo → Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `AWS_ACCOUNT_ID` | Your 12-digit AWS account ID |
| `AWS_DEPLOY_ROLE_ARN` | IAM role ARN for OIDC (see below) |

### OIDC Role for GitHub Actions (no static keys)
```bash
# Create the trust policy
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
      "StringLike":   { "token.actions.githubusercontent.com:sub": "repo:<YOUR_ORG>/ride-platform:*" }
    }
  }]
}
EOF

aws iam create-role \
  --role-name ride-platform-github-deploy \
  --assume-role-policy-document file://trust-policy.json

aws iam attach-role-policy \
  --role-name ride-platform-github-deploy \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

# Copy the role ARN → set as AWS_DEPLOY_ROLE_ARN secret
```

---

## 10. ArgoCD Setup
```bash
# After terraform apply and kubeconfig is set
bash infra/argocd/install.sh

# Update repoURL in infra/argocd/application.yaml with your actual GitHub repo URL
# Then re-apply:
kubectl apply -f infra/argocd/application.yaml
```

```bash
cd infra/terraform

terraform init
terraform plan -var="db_password=<password>" -var="stripe_secret_key=<key>"
terraform apply -var="db_password=<password>" -var="stripe_secret_key=<key>"
```

Resources created (in dependency order):
1. VPC + subnets + NAT gateways
2. EKS cluster + node groups
3. MSK (Kafka)
4. ElastiCache (Redis)
5. Aurora PostgreSQL
6. SNS topics + SQS DLQs
