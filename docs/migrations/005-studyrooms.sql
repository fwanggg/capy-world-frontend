-- Create studyrooms table
-- A studyroom is a persistent chat thread that groups a chat session with a user-facing name.
-- Each studyroom owns one chat_session; personas and messages live under that session.
CREATE TABLE studyrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Studyroom 1',
  session_id UUID UNIQUE REFERENCES chat_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_studyrooms_user_id ON studyrooms(user_id);
