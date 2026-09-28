# Dogfood Platform Architecture

## System Overview

The Dogfood Platform is designed as a locally hostable, standalone monorepo. It explicitly avoids cloud-only dependencies (no hosted databases, no mandatory CDNs, no external auth services) to comply with offline/local hackathon execution rules.

### Architecture Flow

```text
Browser
   ↓
Next.js Application (App Router, Server Actions)
   ↓
API / Business Logic Layer (Next.js server-side)
   ↓
PostgreSQL Database (Dockerized)
```

## Docker and Startup Flow

The application is containerized using `docker-compose`.

1. **Database Container (`db`)**:
   - Runs `postgres:15-alpine`.
   - Mounts a persistent volume `postgres_data` so data survives restarts.
   - Exposes a healthcheck using `pg_isready` to ensure it is fully running before dependent services start.

2. **Web Container (`web`)**:
   - Runs a highly optimized Next.js `standalone` production build.
   - Uses `depends_on` (service_healthy) to wait for PostgreSQL.
   - **Startup Sequence**:
     - Executes `node db/migrate.js` to run schema migrations deterministically.
     - Executes `node db/seed.js` to insert deterministic fixture data.
     - Finally, executes `node server.js` to start the Next.js runtime.

## Migration and Seeding

- **Migrations**: Stored as raw SQL in `db/migrations/`. A lightweight custom script (`db/migrate.js`) tracks and applies these incrementally without relying on heavyweight ORMs.
- **Seeding**: `db/seed.js` deterministically inserts baseline hackathon data (organizers, judges, participants, events, teams).

## Authentication and RBAC

**Authentication Model:**
- Passwords are securely hashed with `bcrypt`. Hashes are never exposed.
- Authentication utilizes server-side sessions stored in PostgreSQL.
- Session tokens are generated using cryptographically secure random bytes. Only SHA-256 hashes of these tokens are persisted in the `sessions` table.
- Raw session tokens are exclusively delivered to the client via `HttpOnly`, `SameSite=lax` secure cookies, ensuring zero exposure via JSON APIs.

**Role-Based Access Control (RBAC):**
- **Global Roles**: Users have a platform-level role (`ADMIN` or `USER`). 
- **Event Roles**: Event-specific roles (`ORGANIZER`, `JUDGE`, `PARTICIPANT`) are isolated strictly within the `event_members` table.
- **Cross-Event Isolation**: A user acting as a JUDGE in Event A retains only standard participant rights in Event B unless specifically granted.
- Security helpers (`requireUser`, `requirePlatformAdmin`, `requireEventRole`) guarantee consistent validation flow and reject expired sessions.
