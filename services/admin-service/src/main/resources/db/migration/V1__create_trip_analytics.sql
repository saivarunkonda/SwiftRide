CREATE TABLE IF NOT EXISTS trip_analytics (
    trip_id            VARCHAR(36)    PRIMARY KEY,
    rider_id           VARCHAR(36),
    driver_id          VARCHAR(36),
    status             VARCHAR(20),
    geohash_zone       VARCHAR(10),
    final_fare         NUMERIC(10,2),
    surge_multiplier   NUMERIC(5,2)   DEFAULT 1.0,
    match_latency_ms   BIGINT,
    trip_duration_ms   BIGINT,
    trip_date          TIMESTAMPTZ,
    recorded_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trip_analytics_date   ON trip_analytics(trip_date);
CREATE INDEX idx_trip_analytics_status ON trip_analytics(status);
CREATE INDEX idx_trip_analytics_zone   ON trip_analytics(geohash_zone);
