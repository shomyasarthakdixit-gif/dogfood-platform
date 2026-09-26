-- 004_gallery_search_track.sql
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS track_id UUID REFERENCES tracks(id) ON DELETE SET NULL;
