CREATE TABLE IF NOT EXISTS driver_profiles (
    user_id              VARCHAR(36)   PRIMARY KEY REFERENCES users(id),
    license_number       VARCHAR(50)   NOT NULL UNIQUE,
    vehicle_make         VARCHAR(50)   NOT NULL,
    vehicle_model        VARCHAR(50)   NOT NULL,
    vehicle_year         INT           NOT NULL,
    license_plate        VARCHAR(20)   NOT NULL UNIQUE,
    vehicle_type         VARCHAR(20)   NOT NULL,
    onboarding_status    VARCHAR(30)   NOT NULL DEFAULT 'PENDING',
    background_check_id  VARCHAR(100),
    documents_s3_key     VARCHAR(255),
    approved_at          TIMESTAMPTZ,
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_driver_profiles_status ON driver_profiles(onboarding_status);
