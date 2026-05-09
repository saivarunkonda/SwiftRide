CREATE TABLE IF NOT EXISTS users (
    id                  VARCHAR(36)   PRIMARY KEY,
    email               VARCHAR(255)  NOT NULL UNIQUE,
    name                VARCHAR(255)  NOT NULL,
    phone               VARCHAR(20),
    role                VARCHAR(10)   NOT NULL,
    stripe_customer_id  VARCHAR(100),
    rating              NUMERIC(3,1)  NOT NULL DEFAULT 5.0,
    active              BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);
