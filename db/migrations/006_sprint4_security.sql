-- 006_sprint4_security.sql

CREATE TABLE rate_limits (
    key VARCHAR(255) PRIMARY KEY,
    points INT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_rate_limits_expires_at ON rate_limits (expires_at);
