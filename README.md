# Swift Ride — Travel with your partner

## Stack
- Go (Gin) — HTTP API
- Apache Kafka — event streaming
- Redis — hot cache (latest driver position, 30s TTL)
- Cassandra — location history (7 day TTL)
- Prometheus — metrics

## Run locally

### 1. Start infrastructure
```bash
cd infra
docker compose up -d
```

Services:
| Service          | URL                        |
|------------------|----------------------------|
| Kafka UI         | http://localhost:8080       |
| Elasticsearch    | http://localhost:9200       |
| Kibana           | http://localhost:5601       |
| Prometheus       | http://localhost:9090       |
| Redis            | localhost:6379              |
| Cassandra        | localhost:9042              |

### 2. Run Location Service (Go)
```bash
cd services/location-service
go mod tidy && go run ./cmd/main.go
```

### 4. Run Surge Pricing Service (Java)
```bash
cd services/surge-pricing-service
./mvnw spring-boot:run
```

### 5. Run Notification Service (Java)
```bash
cd services/notification-service
./mvnw spring-boot:run
```

### 6. Run Payment Service (Java)
```bash
# requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET env vars
export STRIPE_SECRET_KEY=sk_test_...
export STRIPE_WEBHOOK_SECRET=whsec_...
cd services/payment-service
./mvnw spring-boot:run
```

### 7. Run API Gateway (Go) — single entry point for all clients
```bash
cd services/api-gateway
go mod tidy && go run ./cmd/main.go
```

All traffic goes through `:8080`. Services are not exposed directly.

### 4. Test via API Gateway (port 8080)

First get a JWT (for local dev, generate one with your JWT_SECRET):
```powershell
# All requests go through the gateway on :8080

# Push driver location (requires driver JWT)
Invoke-WebRequest -Uri "http://localhost:8080/v1/drivers/driver-123/location" `
  -Method POST `
  -Headers @{ "Authorization" = "Bearer <driver_jwt>"; "Content-Type" = "application/json" } `
  -Body '{"lat": 37.7749, "lng": -122.4194, "speed": 30, "heading": 90}'

# Request a trip match (requires rider JWT)
Invoke-WebRequest -Uri "http://localhost:8080/v1/trips/match" `
  -Method POST `
  -Headers @{ "Authorization" = "Bearer <rider_jwt>"; "Content-Type" = "application/json" } `
  -Body '{"riderId":"rider-1","pickupLat":37.7750,"pickupLng":-122.4180,"dropoffLat":37.79,"dropoffLng":-122.40}'

# Check surge for a location (any authenticated user)
Invoke-WebRequest -Uri "http://localhost:8080/v1/surge?lat=37.7749&lng=-122.4194" `
  -Headers @{ "Authorization" = "Bearer <jwt>" }
```

Metrics:
```bash
curl http://localhost:8081/metrics
```

## Architecture

```
                    Clients (iOS / Android / Web)
                              │
                    API Gateway :8080
                    ├── JWT auth (Cognito)
                    ├── Rate limiting (Redis)
                    ├── Request ID injection
                    └── Reverse proxy
                              │
          ┌───────────────────┼──────────────────────┐
          │                   │                      │
  /v1/drivers/*       /v1/trips/match         /v1/surge/*
  location-svc:8081   matching-svc:8082       surge-svc:8083
  (Go)                (Java)                  (Java/KStreams)
          │                   │                      │
     Kafka Producer    Kafka Consumer          Kafka Streams
          │            + ES geo query          topology
          └──────────────────►│◄──────────────────────┘
                    driver.location.updates
                              │
                    ┌─────────┴──────────┐
                 Redis               Cassandra
            (latest pos)           (history 7d)

  /v1/payments/*
  payment-svc:8085 (Java)
  ├── Stripe PaymentIntent
  ├── Idempotent (tripId key)
  └── Publishes payment.events → Kafka

  notification-svc:8084 (Java)
  └── Kafka consumer (trip.events)
      └── AWS SNS → FCM / APNS / SMS
```

## Service Port Map
| Service              | Port  | Language |
|----------------------|-------|----------|
| API Gateway          | 8080  | Go       |
| Location Service     | 8081  | Go       |
| Trip Matching        | 8082  | Java     |
| Surge Pricing        | 8083  | Java     |
| Notification Service | 8084  | Java     |
| Payment Service      | 8085  | Java     |
| Kafka UI             | 8080* | —        |
| Jaeger UI            | 16686 | —        |
| Grafana              | 3000  | —        |
| Prometheus           | 9090  | —        |
| Kibana               | 5601  | —        |

\* Kafka UI runs on 8080 in docker-compose only; gateway takes 8080 when running locally
