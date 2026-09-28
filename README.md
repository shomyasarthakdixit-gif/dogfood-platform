# Dogfood Platform

An open-source, self-hostable hackathon submission and judging platform for the Dogfood 2026 challenge.

## Purpose

The Dogfood Platform provides a robust, locally runnable foundation for organizing, submitting, and judging hackathons without relying on external cloud services or vendor lock-in.

## Major Capabilities
- **Authentication & Roles**: Secure HTTP-only cookie sessions, RBAC for Admin, Organizer, Judge, Participant.
- **Event Management**: Tracks, prizes, deadlines, and submissions.
- **Team Formation**: Secure token-based team invitations.
- **Judging Engine**: Event-specific judge matrix, rubric scoring, and Z-score normalization to mitigate judge bias.
- **Community Engagement**: Public project gallery, randomized display, rate-limited and duplicate-prevented voting.
- **Security & Auditing**: Strict API authorization, cross-event isolation, and action audit logs.

## Architecture
The platform operates as a self-hostable monolith on Next.js 16 (App Router) backed by PostgreSQL. It employs a fully offline/no-cloud dependency model (no external API, auth provider, or hosted service required).

## Technology Stack

- **Framework**: Next.js (App Router), React, TypeScript
- **Database**: PostgreSQL (Dockerized)
- **Validation**: Zod
- **Testing**: Vitest (Unit/Integration), Playwright (E2E)
- **Infrastructure**: Docker, Docker Compose

## Self-Hosting & Offline Model
Dogfood Platform is strictly designed for local, private, and air-gapped environments if necessary. There are zero cloud dependencies. Authentication and database functions are completely self-contained within the platform.

## Prerequisites

- Node.js (v20+)
- npm (v9+)
- Docker and Docker Compose

## Environment Configuration

Copy the example environment file and configure it if needed:

```bash
cp .env.example .env
```
*(By default, `.env.example` works automatically with the local Docker Compose setup).*

## Local Development

To run the full stack locally for development or demonstration:

```bash
docker compose up --build -d
```
The Next.js application will be available at [http://localhost:3000](http://localhost:3000).

### What Happens on Startup?
1. The **PostgreSQL** database spins up and waits to become healthy.
2. The Web container automatically runs **migrations** to bring the schema up to date.
3. **Seed Data** is automatically inserted deterministically so you have a working environment immediately.

### Local Demo Credentials

These credentials are for local/demo evaluation only. They are seeded automatically in the development database. They are **NOT** production credentials. Self-hosted production deployments should replace/remove them.

**Participant Account:**
- Email: `participant1@dogfood.local`
- Password: `password123`

**Organizer Account:**
- Email: `organizer@dogfood.local`
- Password: `password123`

**Judge Accounts:**
- Email: `judge1@dogfood.local`, `judge2@dogfood.local`, `judge3@dogfood.local`
- Password: `password123`

### How to Reset the Local Database
To completely wipe the database and start fresh:
```bash
docker compose down -v
docker compose up --build -d
```

## Basic Health-Check

Once the stack is running, you can verify the system health by visiting:

[http://localhost:3000/api/health](http://localhost:3000/api/health)

Expected response:
```json
{
  "status": "ok",
  "database": "ok"
}
```

## How to Run Tests

Install dependencies first if you haven't:
```bash
npm ci
```

**Unit and Integration Tests** (requires database running for integration tests):
```bash
npx vitest run
```

**End-to-End Tests**:
```bash
npx playwright test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
