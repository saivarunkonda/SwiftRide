package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// RateLimiter uses a sliding window counter in Redis.
// Key: ratelimit:<user_id> — resets every minute.
func RateLimiter(rdb *redis.Client, limitPerMinute int) gin.HandlerFunc {
	return func(c *gin.Context) {
		// identify by user ID if authenticated, otherwise by IP
		identifier := c.GetHeader("X-User-ID")
		if identifier == "" {
			identifier = c.ClientIP()
		}

		key := fmt.Sprintf("ratelimit:%s", identifier)
		ctx := context.Background()

		pipe := rdb.Pipeline()
		incr := pipe.Incr(ctx, key)
		pipe.Expire(ctx, key, time.Minute)
		_, err := pipe.Exec(ctx)

		if err != nil {
			// Redis unavailable — fail open (don't block requests)
			c.Next()
			return
		}

		count := incr.Val()
		remaining := int64(limitPerMinute) - count

		c.Header("X-RateLimit-Limit", strconv.Itoa(limitPerMinute))
		c.Header("X-RateLimit-Remaining", strconv.FormatInt(max(remaining, 0), 10))
		c.Header("X-RateLimit-Reset", strconv.FormatInt(time.Now().Add(time.Minute).Unix(), 10))

		if count > int64(limitPerMinute) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":       "rate limit exceeded",
				"retry_after": 60,
			})
			return
		}

		c.Next()
	}
}

func max(a, b int64) int64 {
	if a > b {
		return a
	}
	return b
}
