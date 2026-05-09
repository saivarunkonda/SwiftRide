package middleware

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
)

// Logger emits structured access logs with request ID, latency, and status.
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		latency := time.Since(start)

		requestID, _ := c.Get("request_id")
		userID := c.GetHeader("X-User-ID")

		fmt.Printf(`{"time":"%s","request_id":"%v","method":"%s","path":"%s","status":%d,"latency_ms":%d,"user_id":"%s","ip":"%s"}%s`,
			time.Now().UTC().Format(time.RFC3339),
			requestID,
			c.Request.Method,
			c.Request.URL.Path,
			c.Writer.Status(),
			latency.Milliseconds(),
			userID,
			c.ClientIP(),
			"\n",
		)
	}
}
