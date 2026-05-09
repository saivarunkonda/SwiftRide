CREATE TABLE IF NOT EXISTS payments (
    id                       VARCHAR(36)    PRIMARY KEY,
    trip_id                  VARCHAR(36)    NOT NULL UNIQUE,
    rider_id                 VARCHAR(36)    NOT NULL,
    driver_id                VARCHAR(36)    NOT NULL,
    amount                   NUMERIC(10,2)  NOT NULL,
    surge_multiplier         NUMERIC(10,2)  NOT NULL DEFAULT 1.0,
    currency                 VARCHAR(3)     NOT NULL DEFAULT 'usd',
    status                   VARCHAR(20)    NOT NULL,
    stripe_payment_intent_id VARCHAR(100),
    failure_reason           TEXT,
    created_at               TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_rider_id  ON payments(rider_id);
CREATE INDEX idx_payments_driver_id ON payments(driver_id);
CREATE INDEX idx_payments_status    ON payments(status);
