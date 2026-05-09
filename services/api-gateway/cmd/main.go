package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/redis/go-redis/v9"
	"github.com/ride-platform/api-gateway/internal/config"
	"github.com/ride-platform/api-gateway/internal/middleware"
	"github.com/ride-platform/api-gateway/internal/proxy"
	"github.com/ride-platform/api-gateway/internal/telemetry"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
)

func main() {
	cfg := config.Load()

	// --- tracing ---
	shutdown, err := telemetry.InitTracer("api-gateway")
	if err != nil {
		log.Printf("WARNING: tracing init failed: %v", err)
	} else {
		defer shutdown(context.Background())
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		PoolSize: 20,
	})

	// verify Redis connection (non-fatal — rate limiter fails open)
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		log.Printf("WARNING: Redis unavailable, rate limiting disabled: %v", err)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(otelgin.Middleware("api-gateway")) // root span per request
	r.Use(middleware.RequestID())
	r.Use(middleware.Logger())
	r.Use(middleware.CORS())

	// ── public routes (no auth) ──────────────────────────────────────────
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "time": time.Now().UTC()})
	})
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// ── protected routes ─────────────────────────────────────────────────
	authMiddleware := middleware.Auth(cfg.JWTSecret)
	rateLimiter := middleware.RateLimiter(rdb, cfg.RateLimitPerMinute)

	v1 := r.Group("/v1", authMiddleware, rateLimiter)
	{
		// Driver location — drivers only
		v1.Any("/drivers/*path",
			middleware.RequireRole("driver"),
			proxy.New(cfg.LocationServiceURL),
		)

		// Trip matching — riders only
		v1.POST("/trips/match",
			middleware.RequireRole("rider"),
			proxy.New(cfg.MatchingServiceURL),
		)

		// Surge pricing — any authenticated user (riders see surge before booking)
		v1.GET("/surge", proxy.New(cfg.SurgeServiceURL))
		v1.GET("/surge/zone/:zoneId", proxy.New(cfg.SurgeServiceURL))

		// Payments — riders and admins
		v1.POST("/payments/charge",
			middleware.RequireRole("rider"),
			proxy.New(cfg.PaymentServiceURL),
		)
		v1.POST("/payments/:tripId/refund",
			middleware.RequireRole("admin"),
			proxy.New(cfg.PaymentServiceURL),
		)
		v1.POST("/payments/webhook", proxy.New(cfg.PaymentServiceURL))

		// Users — registration and profile
		v1.POST("/users/register", proxy.New(cfg.UserServiceURL))
		v1.GET("/users/me", proxy.New(cfg.UserServiceURL))
		v1.GET("/users/:id", proxy.New(cfg.UserServiceURL))

		// Driver onboarding
		v1.POST("/drivers/onboarding/apply",
			middleware.RequireRole("driver"),
			proxy.New(cfg.UserServiceURL),
		)
		v1.GET("/drivers/onboarding/status",
			middleware.RequireRole("driver"),
			proxy.New(cfg.UserServiceURL),
		)
		v1.GET("/drivers/onboarding/pending",
			middleware.RequireRole("admin"),
			proxy.New(cfg.UserServiceURL),
		)
		v1.POST("/drivers/onboarding/:userId/approve",
			middleware.RequireRole("admin"),
			proxy.New(cfg.UserServiceURL),
		)
		v1.POST("/drivers/onboarding/:userId/reject",
			middleware.RequireRole("admin"),
			proxy.New(cfg.UserServiceURL),
		)

		// Admin dashboard — admin only
		v1.GET("/admin/dashboard",
			middleware.RequireRole("admin"),
			proxy.New(cfg.AdminServiceURL),
		)
		v1.GET("/admin/surge-zones",
			middleware.RequireRole("admin"),
			proxy.New(cfg.AdminServiceURL),
		)
	}

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("api-gateway listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("shutting down api-gateway...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}
