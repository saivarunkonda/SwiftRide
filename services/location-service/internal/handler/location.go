package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ride-platform/location-service/internal/cache"
	"github.com/ride-platform/location-service/internal/kafka"
	"github.com/ride-platform/location-service/internal/models"
	"github.com/ride-platform/location-service/internal/store"
)

type LocationHandler struct {
	producer  *kafka.Producer
	redis     *cache.RedisClient
	cassandra *store.CassandraStore
}

func NewLocationHandler(p *kafka.Producer, r *cache.RedisClient, c *store.CassandraStore) *LocationHandler {
	return &LocationHandler{producer: p, redis: r, cassandra: c}
}

// POST /v1/drivers/:id/location
func (h *LocationHandler) UpdateLocation(c *gin.Context) {
	driverID := c.Param("id")

	var req struct {
		Lat     float64 `json:"lat" binding:"required"`
		Lng     float64 `json:"lng" binding:"required"`
		Speed   float64 `json:"speed"`
		Heading float64 `json:"heading"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	event := &models.LocationEvent{
		DriverID:  driverID,
		Lat:       req.Lat,
		Lng:       req.Lng,
		Speed:     req.Speed,
		Heading:   req.Heading,
		Timestamp: time.Now().UTC(),
	}

	if err := h.producer.PublishLocation(event); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to publish event"})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"status": "accepted"})
}

// GET /v1/drivers/:id/location
func (h *LocationHandler) GetLocation(c *gin.Context) {
	driverID := c.Param("id")

	event, err := h.redis.GetDriverLocation(c.Request.Context(), driverID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cache error"})
		return
	}
	if event == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "driver not found or offline"})
		return
	}

	c.JSON(http.StatusOK, event)
}

// GET /v1/drivers/:id/location/history?from=<unix>&to=<unix>
func (h *LocationHandler) GetLocationHistory(c *gin.Context) {
	driverID := c.Param("id")

	fromUnix := c.DefaultQuery("from", "0")
	toUnix := c.DefaultQuery("to", "0")

	var fromT, toT time.Time
	if fromUnix != "0" {
		fromT = time.Unix(parseUnix(fromUnix), 0)
	} else {
		fromT = time.Now().Add(-1 * time.Hour)
	}
	if toUnix != "0" {
		toT = time.Unix(parseUnix(toUnix), 0)
	} else {
		toT = time.Now()
	}

	events, err := h.cassandra.GetLocationHistory(c.Request.Context(), driverID, fromT, toT)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "store error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"driver_id": driverID, "history": events})
}

func parseUnix(s string) int64 {
	var v int64
	for _, ch := range s {
		if ch >= '0' && ch <= '9' {
			v = v*10 + int64(ch-'0')
		}
	}
	return v
}
