FROM golang:1.21-alpine AS builder

RUN apk add --no-cache gcc musl-dev librdkafka-dev pkgconf

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -o location-service ./cmd/main.go

# ---

FROM alpine:3.18
RUN apk add --no-cache librdkafka ca-certificates

WORKDIR /app
COPY --from=builder /app/location-service .

EXPOSE 8081
CMD ["./location-service"]
