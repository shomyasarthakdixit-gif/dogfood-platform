-- 002_auth_schema.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS token_hash VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions (token_hash) WHERE token_hash IS NOT NULL;
