-- 008_team_invitee.sql

ALTER TABLE team_invitations
ADD COLUMN IF NOT EXISTS invitee_id UUID REFERENCES users(id) ON DELETE CASCADE;
