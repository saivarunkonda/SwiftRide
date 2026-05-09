package config

import "os"

type Config struct {
	Port string

	// downstream service URLs
	LocationServiceURL  string
	MatchingServiceURL  string
	SurgeServiceURL     string
	PaymentServiceURL   string
	UserServiceURL      string
	AdminServiceURL     string

	// auth
	JWTSecret      string
	JWTSecret      string
	CognitoIssuer  string // e.g. https://cognito-idp.us-east-1.amazonaws.com/<pool-id>

	// rate limiting
	RedisAddr          string
	RateLimitPerMinute int
}

func Load() *Config {
	return &Config{
		Port:                getEnv("PORT", "8080"),
		LocationServiceURL:  getEnv("LOCATION_SERVICE_URL", "http://localhost:8081"),
		MatchingServiceURL:  getEnv("MATCHING_SERVICE_URL", "http://localhost:8082"),
		SurgeServiceURL:     getEnv("SURGE_SERVICE_URL", "http://localhost:8083"),
		PaymentServiceURL:   getEnv("PAYMENT_SERVICE_URL", "http://localhost:8085"),
		UserServiceURL:      getEnv("USER_SERVICE_URL", "http://localhost:8086"),
		AdminServiceURL:     getEnv("ADMIN_SERVICE_URL", "http://localhost:8087"),
		JWTSecret:           getEnv("JWT_SECRET", "change-me-in-production"),
		CognitoIssuer:       getEnv("COGNITO_ISSUER", ""),
		RedisAddr:           getEnv("REDIS_ADDR", "localhost:6379"),
		RateLimitPerMinute:  120,
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
