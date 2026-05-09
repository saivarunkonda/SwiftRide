package proxy

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"

	"github.com/gin-gonic/gin"
)

// httpClient shared across all proxies — connection pooling
var httpClient = &http.Client{
	Timeout: 30 * time.Second,
	Transport: &http.Transport{
		MaxIdleConns:        200,
		MaxIdleConnsPerHost: 50,
		IdleConnTimeout:     90 * time.Second,
	},
}

// New returns a Gin handler that reverse-proxies to targetURL,
// stripping stripPrefix from the path before forwarding.
//
// Example: stripPrefix="/v1", targetURL="http://location-service:8081"
//   incoming:  /v1/drivers/123/location
//   forwarded: /v1/drivers/123/location  (prefix kept — services use /v1 too)
func New(targetURL string) gin.HandlerFunc {
	target, err := url.Parse(targetURL)
	if err != nil {
		panic(fmt.Sprintf("invalid proxy target URL %q: %v", targetURL, err))
	}

	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.Transport = httpClient.Transport

	// custom error handler so we return JSON instead of plain text
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		fmt.Fprintf(w, `{"error":"upstream service unavailable","detail":"%s"}`, err.Error())
	}

	return func(c *gin.Context) {
		// forward trace and identity headers to downstream
		c.Request.Header.Set("X-Request-ID", fmt.Sprintf("%v", c.MustGet("request_id")))

		proxy.ServeHTTP(c.Writer, c.Request)
	}
}
