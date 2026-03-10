-- Create app_log table for observability
CREATE TABLE app_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  environment TEXT NOT NULL,
  event TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  request_id TEXT,
  source_file TEXT,
  source_line INT,
  metadata JSONB DEFAULT '{}'::jsonb,
  duration_ms INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_app_log_timestamp ON app_log(timestamp DESC);
CREATE INDEX idx_app_log_level ON app_log(level);
CREATE INDEX idx_app_log_environment ON app_log(environment);
CREATE INDEX idx_app_log_event ON app_log(event);
CREATE INDEX idx_app_log_user_id ON app_log(user_id);
CREATE INDEX idx_app_log_request_id ON app_log(request_id);

-- Create composite index for common queries (environment + level + timestamp)
CREATE INDEX idx_app_log_env_level_time ON app_log(environment, level, timestamp DESC);
