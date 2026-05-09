package models

import "time"

// LocationEvent is the core domain model for a driver GPS ping
type LocationEvent struct {
	DriverID  string    `json:"driver_id"`
	Lat       float64   `json:"lat"`
	Lng       float64   `json:"lng"`
	Speed     float64   `json:"speed"`      // km/h
	Heading   float64   `json:"heading"`    // degrees 0-360
	Timestamp time.Time `json:"timestamp"`
}
