package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"github.com/ride-platform/location-service/internal/cache"
	"github.com/ride-platform/location-service/internal/models"
	"github.com/ride-platform/location-service/internal/store"
)

type Consumer struct {
	consumer *kafka.Consumer
	redis    *cache.RedisClient
	cassandra *store.CassandraStore
}

func NewConsumer(brokers, groupID string, redis *cache.RedisClient, cass *store.CassandraStore) (*Consumer, error) {
	c, err := kafka.NewConsumer(&kafka.ConfigMap{
		"bootstrap.servers":        brokers,
		"group.id":                 groupID,
		"auto.offset.reset":        "latest",
		"enable.auto.commit":       false,   // manual commit for at-least-once
		"max.poll.interval.ms":     300000,
		"session.timeout.ms":       30000,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create kafka consumer: %w", err)
	}

	if err := c.SubscribeTopics([]string{locationTopic}, nil); err != nil {
		return nil, fmt.Errorf("subscribe error: %w", err)
	}

	return &Consumer{consumer: c, redis: redis, cassandra: cass}, nil
}

// Start begins consuming in a blocking loop; cancel ctx to stop
func (c *Consumer) Start(ctx context.Context) {
	log.Println("location consumer started")
	for {
		select {
		case <-ctx.Done():
			log.Println("consumer shutting down")
			c.consumer.Close()
			return
		default:
			msg, err := c.consumer.ReadMessage(100) // 100ms poll timeout
			if err != nil {
				// timeout is normal, not an error
				if kafkaErr, ok := err.(kafka.Error); ok && kafkaErr.Code() == kafka.ErrTimedOut {
					continue
				}
				log.Printf("consumer error: %v", err)
				continue
			}

			if err := c.process(ctx, msg); err != nil {
				log.Printf("process error: %v", err)
				continue
			}

			// commit only after successful processing
			if _, err := c.consumer.CommitMessage(msg); err != nil {
				log.Printf("commit error: %v", err)
			}
		}
	}
}

func (c *Consumer) process(ctx context.Context, msg *kafka.Message) error {
	var event models.LocationEvent
	if err := json.Unmarshal(msg.Value, &event); err != nil {
		return fmt.Errorf("unmarshal error: %w", err)
	}

	// write to Redis (hot cache — latest position per driver)
	if err := c.redis.SetDriverLocation(ctx, &event); err != nil {
		return fmt.Errorf("redis write error: %w", err)
	}

	// write to Cassandra (cold store — full history)
	if err := c.cassandra.InsertLocation(ctx, &event); err != nil {
		return fmt.Errorf("cassandra write error: %w", err)
	}

	return nil
}
