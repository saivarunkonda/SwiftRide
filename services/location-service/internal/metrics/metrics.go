package metrics

import "github.com/prometheus/client_golang/prometheus"

var (
	LocationUpdatesTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "location_updates_total",
			Help: "Total number of location update events received",
		},
		[]string{"driver_id"},
	)

	KafkaPublishErrors = prometheus.NewCounter(
		prometheus.CounterOpts{
			Name: "kafka_publish_errors_total",
			Help: "Total Kafka publish failures",
		},
	)

	RequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request latency",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "path", "status"},
	)
)

func Register() {
	prometheus.MustRegister(LocationUpdatesTotal, KafkaPublishErrors, RequestDuration)
}
