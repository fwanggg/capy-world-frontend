-- LangGraph checkpoint tables for thread-based state persistence

CREATE TABLE IF NOT EXISTS checkpoint_writes (
  thread_id TEXT NOT NULL,
  checkpoint_ns TEXT NOT NULL,
  checkpoint_id TEXT NOT NULL,
  ts_created TIMESTAMP DEFAULT now(),
  ts_updated TIMESTAMP DEFAULT now(),
  checkpoint JSONB NOT NULL,
  metadata JSONB,
  parent_checkpoint_id TEXT,
  PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
);

CREATE TABLE IF NOT EXISTS checkpoint_blobs (
  thread_id TEXT NOT NULL,
  checkpoint_ns TEXT NOT NULL,
  checkpoint_id TEXT NOT NULL,
  key TEXT NOT NULL,
  ts_created TIMESTAMP DEFAULT now(),
  blob BYTEA NOT NULL,
  PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, key),
  FOREIGN KEY (thread_id, checkpoint_ns, checkpoint_id)
    REFERENCES checkpoint_writes(thread_id, checkpoint_ns, checkpoint_id)
);

-- Indexes for performance
CREATE INDEX idx_checkpoint_writes_thread ON checkpoint_writes(thread_id);
CREATE INDEX idx_checkpoint_writes_ns ON checkpoint_writes(checkpoint_ns);
CREATE INDEX idx_checkpoint_blobs_thread ON checkpoint_blobs(thread_id);
