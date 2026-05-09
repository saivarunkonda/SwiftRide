package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/ride-platform/location-service/internal/models"
)

const driverLocationTTL = 30 * time.Second // driver considered offline after 30s

type RedisClient struct {
	client *redis.Client
}

func NewRedisClient(addr string) *RedisClient {
	return &RedisClient{
		client: redis.NewClient(&redis.Options{
			Addr:         addr,
			PoolSize:     50,
			MinIdleConns: 10,
		}),
	}
}

func (r *RedisClient) SetDriverLocation(ctx context.Context, event *models.LocationEvent) error {
	key := fmt.Sprintf("driver:location:%s", event.DriverID)
	payload, err := json.Marshal(event)
	if err != nil {
		return err
	}
	return r.client.Set(ctx, key, payload, driverLocationTTL).Err()
}

func (r *RedisClient) GetDriverLocation(ctx context.Context, driverID string) (*models.LocationEvent, error) {
	key := fmt.Sprintf("driver:location:%s", driverID)
	val, err := r.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil, nil // driver not found / offline
	}
	if err != nil {
		return nil, err
	}

	var event models.LocationEvent
	if err := json.Unmarshal([]byte(val), &event); err != nil {
		return nil, err
	}
	return &event, nil
}

func (r *RedisClient) Ping(ctx context.Context) error {
	return r.client.Ping(ctx).Err()
}
