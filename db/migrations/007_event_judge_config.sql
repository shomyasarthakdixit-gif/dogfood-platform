-- 007_event_judge_config.sql

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS required_judges INTEGER NOT NULL DEFAULT 1 CHECK (required_judges >= 1),
ADD COLUMN IF NOT EXISTS judges_per_submission INTEGER NOT NULL DEFAULT 1 CHECK (judges_per_submission >= 1);
