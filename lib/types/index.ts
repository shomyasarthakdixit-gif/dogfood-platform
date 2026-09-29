export type UserRole = 'ADMIN' | 'USER';
export type EventRole = 'ORGANIZER' | 'JUDGE' | 'PARTICIPANT';
export type TeamMemberRole = 'LEADER' | 'MEMBER';
export type SubmissionStatus = 'DRAFT' | 'SUBMITTED';
export type EventStatus = 'UPCOMING' | 'OPEN' | 'CLOSED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export interface Session {
  user: User;
  expires_at: string;
}

export interface Event {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  registration_start?: string;
  registration_end?: string;
  submission_start?: string;
  submission_end?: string;
  required_judges?: number;
  judges_per_submission?: number;
  created_at: string;
  status?: EventStatus;
  lifecycle_status?: string;
  tracks?: Track[];
  prizes?: Prize[];
}

export interface Track {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Prize {
  id: string;
  event_id: string;
  track_id: string | null;
  name: string;
  description: string | null;
  amount: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  created_at: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamMemberRole;
  created_at: string;
  user?: User;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  team?: Team;
  invited_by?: User;
}

export interface Submission {
  id: string;
  team_id: string;
  event_id: string;
  title: string;
  description: string | null;
  url: string | null;
  status: SubmissionStatus;
  created_at: string;
  team?: Team;
  track?: Track | null;
  technologies?: string[];
  repo_url?: string | null;
  demo_url?: string | null;
  event_submission_end?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
