# Dogfood Platform Data Model

This document outlines the core database schema for the Dogfood Platform.

## Core Entities

- **users**: Represents all individuals in the system. Roles are platform-level (`ADMIN`, `USER`). Event-specific access is handled in `event_members`.
- **sessions**: Tracks active user sessions.
- **events**: Represents a single hackathon or challenge (e.g., "Dogfood 2026"). Uniquely identified by a `slug`.
- **event_members**: Maps users to events with specific roles (`ORGANIZER`, `JUDGE`, `PARTICIPANT`). A user can be a judge in one event and a participant in another.
- **tracks**: Optional sub-categories within an event (e.g., "Core Platform", "Participant Experience").
- **prizes**: Awards associated with an event or specific track.
- **teams**: Groups of participants competing in an event. Names must be unique within an event.
- **team_members**: Maps users to teams.
- **team_invitations**: Secure token-based invites to join a team.
- **submissions**: A team's project entry for an event. Each team can submit exactly once per event.
- **rubrics**: A collection of grading criteria for an event.
- **rubric_criteria**: Individual scoring metrics (e.g., "Innovation", "Technical Execution") within a rubric.
- **judge_profiles**: Captures judge background/expertise per event.
- **judge_assignments**: Links a judge to a specific submission for review.
- **evaluations**: A completed or draft assessment of a submission by a judge. One per assignment.
- **evaluation_scores**: The individual scores for each rubric criterion within an evaluation.
- **normalized_scores**: The final aggregated and statistically normalized score for a submission.
- **votes**: Community or peer votes for a submission. Supports both authenticated voters (`user_id`) and anonymous token voters (`voter_token_hash`).
- **comments**: Feedback or discussion on a submission.
- **audit_logs**: Immutable history of important actions in the system.
- **certificates**: Digital badges or proofs of participation/winning.

## Important Relationships and Constraints

1. **Foreign Keys with Cascading Deletes**: Most hierarchical relationships (e.g., `event_members` to `events`, `teams` to `events`) use `ON DELETE CASCADE` to prevent orphaned records.
2. **Unique Constraints**:
   - `events.slug`: Enforces predictable URL routing.
   - `teams(event_id, name)`: Ensures team names don't collide within the same hackathon.
   - `submissions(team_id, event_id)`: A team can only make one submission per event.
   - `judge_assignments(judge_id, submission_id)`: Prevents assigning the same submission to a judge multiple times.
   - `votes(user_id, submission_id)` and `votes(voter_token_hash, submission_id)`: Enforced via partial unique indexes to ensure neither an authenticated user nor a unique token can vote for the same submission multiple times.
3. **Data Integrity**: Rubric scores and normalized scores use `DECIMAL(10,2)` to maintain precision during normalization algorithms.
