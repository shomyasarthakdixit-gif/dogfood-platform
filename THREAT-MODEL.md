# Threat Model - Dogfood Platform

## 1. Assets
- User accounts and sessions
- Team and submission data
- Judge profiles and evaluations
- Community votes and comments
- Certificates

## 2. Trust Boundaries
- **Public/Anonymous**: Can view public gallery, cast anonymous votes (with token), and view final results (when published).
- **Participants**: Authenticated users who can create teams, submit projects, and comment.
- **Judges**: Evaluators assigned to score specific submissions.
- **Organizers/Admins**: Event managers with full access to settings, judging matrices, and hidden results.
- **System Backend**: Fully trusted environment running Node/Next.js and PostgreSQL.

## 3. Authentication Threats
- **Threat**: Brute-forcing passwords or session hijacking.
- **Mitigation**: Passwords hashed with bcrypt. Sessions use cryptographically secure 256-bit random tokens, stored as SHA-256 hashes in the DB, and set as HttpOnly, Secure, Lax cookies.

## 4. Authorization Threats
- **Threat**: Participant accessing another team's private submission data.
- **Mitigation**: RBAC enforced at the API layer. All mutations require `requireTeamMember` or `requireTeamLeader`. Event data mutations require `requireEventAdmin`.

## 5. Cross-Event Isolation
- **Threat**: Submissions from Event A being voted on or commented on by users restricted to Event B.
- **Mitigation**: Every API endpoint (including votes, gallery, judging) explicitly checks `s.event_id = $1`.

## 6. Session/Token Threats
- **Threat**: Database breach exposes active session tokens.
- **Mitigation**: Tokens are stored as SHA-256 hashes. A breached DB cannot be used to forge live cookies.

## 7. Anonymous Voting Threats
- **Threat**: Bots generating random voter tokens to spam votes.
- **Mitigation**: The system supports secure random anonymous tokens, but rate-limits per IP address and token hash. It requires one token per client identity.

## 8. Duplicate Voting
- **Threat**: A user submitting multiple votes for the same project.
- **Mitigation**: Database-level unique constraints (`user_id, submission_id` and `voter_token_hash, submission_id`) enforce strict one-vote-per-identity rules.

## 9. Rate-Limit Abuse
- **Threat**: DoS or spam via rapid API calls.
- **Mitigation**: A lightweight PostgreSQL-backed fixed-window rate limiter prevents abuse (e.g., max 10 votes per minute per identity).

## 10. SQL Injection
- **Threat**: Malicious input in API routes.
- **Mitigation**: Use of strictly parameterized queries via `pg` library (`$1, $2`). No dynamic SQL string concatenation.

## 11. XSS
- **Threat**: Malicious scripts in comments or submission descriptions.
- **Mitigation**: User inputs are validated with Zod. Comments HTML characters (`<`, `>`) are escaped before database insertion. React inherently escapes output.

## 12. CSRF Considerations
- **Threat**: Cross-site request forgery manipulating submissions.
- **Mitigation**: Next.js App Router enforces CSRF protection by default on mutations. Session cookies are `SameSite=Lax`.

## 13. Result Leakage
- **Threat**: Prematurely exposing judging results or rankings during active voting.
- **Mitigation**: API endpoints for results explicitly block non-admins unless the event `status` is explicitly set to `RESULTS`.

## 14. Judge Manipulation
- **Threat**: Judge modifying scores after deadline or assigning themselves.
- **Mitigation**: Judges cannot assign themselves. Evaluations are immutable once marked `SUBMITTED`.

## 15. Audit Integrity
- **Threat**: Untracked malicious actions.
- **Mitigation**: High-risk mutations (votes, comments) are logged to the `audit_logs` table, storing metadata without raw secrets.

## 16. Denial-of-Service Limitations
- **Threat**: Network-level DDoS.
- **Mitigation**: The internal rate-limiter prevents application-level spam, but true DDoS protection requires external infrastructure (e.g., Cloudflare, NGINX limits) which is outside the self-hosted backend scope.

## 17. Known Limitations
- The random gallery ordering seed rotates predictably if clients do not supply their own seed, which is acceptable for a hackathon context.
- Anonymous voting is inherently susceptible to Sybil attacks (bots generating infinite tokens/IPs). The rate limiter and unique constraints mitigate casual abuse, but cannot definitively prove humanness without external captchas.
