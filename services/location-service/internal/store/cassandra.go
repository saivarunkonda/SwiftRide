package store

import (
	"context"
	"fmt"
	"time"

	"github.com/gocql/gocql"
	"github.com/ride-platform/location-service/internal/models"
)

const (
	keyspace   = "ride_platform"
	createKS   = `CREATE KEYSPACE IF NOT EXISTS ride_platform WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}`
	createTable = `CREATE TABLE IF NOT EXISTS ride_platform.driver_locations (
		driver_id  text,
		ts         timestamp,
		lat        double,
		lng        double,
		speed      double,
		heading    double,
		PRIMARY KEY (driver_id, ts)
	) WITH CLUSTERING ORDER BY (ts DESC)
	  AND default_time_to_live = 604800` // 7 days TTL
)

type CassandraStore struct {
	session *gocql.Session
}

func NewCassandraStore(hosts ...string) (*CassandraStore, error) {
	cluster := gocql.NewCluster(hosts...)
	cluster.Consistency = gocql.Quorum
	cluster.Timeout = 5 * time.Second
	cluster.ConnectTimeout = 10 * time.Second
	cluster.NumConns = 4

	// connect without keyspace first to create it
	session, err := cluster.CreateSession()
	if err != nil {
		return nil, fmt.Errorf("cassandra connect error: %w", err)
	}

	if err := session.Query(createKS).Exec(); err != nil {
		return nil, fmt.Errorf("create keyspace error: %w", err)
	}
	if err := session.Query(createTable).Exec(); err != nil {
		return nil, fmt.Errorf("create table error: %w", err)
	}

	// reconnect with keyspace
	session.Close()
	cluster.Keyspace = keyspace
	session, err = cluster.CreateSession()
	if err != nil {
		return nil, fmt.Errorf("cassandra reconnect error: %w", err)
	}

	return &CassandraStore{session: session}, nil
}

func (s *CassandraStore) InsertLocation(ctx context.Context, e *models.LocationEvent) error {
	return s.session.Query(
		`INSERT INTO driver_locations (driver_id, ts, lat, lng, speed, heading) VALUES (?, ?, ?, ?, ?, ?)`,
		e.DriverID, e.Timestamp, e.Lat, e.Lng, e.Speed, e.Heading,
	).WithContext(ctx).Exec()
}

func (s *CassandraStore) GetLocationHistory(ctx context.Context, driverID string, from, to time.Time) ([]models.LocationEvent, error) {
	iter := s.session.Query(
		`SELECT driver_id, ts, lat, lng, speed, heading FROM driver_locations WHERE driver_id = ? AND ts >= ? AND ts <= ?`,
		driverID, from, to,
	).WithContext(ctx).Iter()

	var events []models.LocationEvent
	var e models.LocationEvent
	for iter.Scan(&e.DriverID, &e.Timestamp, &e.Lat, &e.Lng, &e.Speed, &e.Heading) {
		events = append(events, e)
	}
	return events, iter.Close()
}

func (s *CassandraStore) Close() {
	s.session.Close()
}
