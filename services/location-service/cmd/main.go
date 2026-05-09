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
	"github.com/ride-platform/location-service/internal/cache"
	"github.com/ride-platform/location-service/internal/handler"
	kafkaclient "github.com/ride-platform/location-service/internal/kafka"
	"github.com/ride-platform/location-service/internal/metrics"
	"github.com/ride-platform/location-service/internal/store"
	"github.com/ride-platform/location-service/internal/telemetry"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
)

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	metrics.Register()

	// --- tracing ---
	shutdown, err := telemetry.InitTracer("location-service")
	if err != nil {
		log.Printf("WARNING: tracing init failed: %v", err)
	} else {
		defer shutdown(context.Background())
	}

	// --- dependencies ---
	kafkaBrokers := getEnv("KAFKA_BROKERS", "localhost:9092")
	redisAddr := getEnv("REDIS_ADDR", "localhost:6379")
	cassandraHost := getEnv("CASSANDRA_HOST", "localhost")

	producer, err := kafkaclient.NewProducer(kafkaBrokers)
	if err != nil {
		log.Fatalf("kafka producer: %v", err)
	}
	defer producer.Close()

	redisClient := cache.NewRedisClient(redisAddr)

	cassandraStore, err := store.NewCassandraStore(cassandraHost)
	if err != nil {
		log.Fatalf("cassandra: %v", err)
	}
	defer cassandraStore.Close()

	// --- kafka consumer (runs in background) ---
	consumer, err := kafkaclient.NewConsumer(kafkaBrokers, "location-service-group", redisClient, cassandraStore)
	if err != nil {
		log.Fatalf("kafka consumer: %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go consumer.Start(ctx)

	// --- HTTP server ---
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(otelgin.Middleware("location-service")) // auto-creates spans per request

	h := handler.NewLocationHandler(producer, redisClient, cassandraStore)

	v1 := r.Group("/v1")
	{
		v1.POST("/drivers/:id/location", h.UpdateLocation)
		v1.GET("/drivers/:id/location", h.GetLocation)
		v1.GET("/drivers/:id/location/history", h.GetLocationHistory)
	}

	r.GET("/metrics", gin.WrapH(promhttp.Handler()))
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "time": time.Now().UTC()})
	})

	srv := &http.Server{
		Addr:    ":8081",
		Handler: r,
	}

	go func() {
		log.Println("location-service listening on :8081")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	// graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("shutting down...")
	cancel()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	srv.Shutdown(shutdownCtx)
}
