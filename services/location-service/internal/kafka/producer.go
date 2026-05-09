package kafka

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"github.com/ride-platform/location-service/internal/models"
)

const locationTopic = "driver.location.updates"

type Producer struct {
	producer *kafka.Producer
}

func NewProducer(brokers string) (*Producer, error) {
	p, err := kafka.NewProducer(&kafka.ConfigMap{
		"bootstrap.servers":            brokers,
		"acks":                         "all",       // wait for all replicas
		"retries":                      5,
		"retry.backoff.ms":             200,
		"linger.ms":                    5,           // small batching window
		"batch.size":                   16384,
		"compression.type":             "snappy",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create kafka producer: %w", err)
	}

	// async delivery report handler
	go func() {
		for e := range p.Events() {
			if m, ok := e.(*kafka.Message); ok && m.TopicPartition.Error != nil {
				log.Printf("delivery failed: %v", m.TopicPartition.Error)
			}
		}
	}()

	return &Producer{producer: p}, nil
}

func (p *Producer) PublishLocation(event *models.LocationEvent) error {
	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("marshal error: %w", err)
	}

	return p.producer.Produce(&kafka.Message{
		TopicPartition: kafka.TopicPartition{
			Topic:     &locationTopic,
			Partition: kafka.PartitionAny,
		},
		Key:   []byte(event.DriverID), // same driver always goes to same partition
		Value: payload,
	}, nil)
}

func (p *Producer) Close() {
	p.producer.Flush(5000)
	p.producer.Close()
}
