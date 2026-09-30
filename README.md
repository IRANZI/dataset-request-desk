# Dataset Request Desk

Dataset Request Desk is an internal platform for managing robotics dataset collection requests.

The platform allows clients to request datasets, operations staff to import and assign robot episodes, and clients to accept or reject completed deliveries.

## Features

* JWT authentication
* Role-based access control
* Client request creation
* Client request ownership protection
* Operator request management
* Admin/operator permissions
* Request status workflow
* Status history and audit trail
* Episode CSV import
* Idempotent episode imports
* Episode filtering
* Episode assignment
* Assignment validation
* PostgreSQL database
* Alembic migrations
* Database-side analytics
* Automated tests
* Docker Compose setup
* Health endpoint
* Request logging

---

# Architecture

```text
                         React Frontend
                              |
                              | HTTP / JSON
                              |
                              v
                       FastAPI REST API
                              |
             +----------------+----------------+
             |                |                |
             v                v                v
          Auth/RBAC       Requests          Episodes
             |                |                |
             +----------------+----------------+
                              |
                              v
                         PostgreSQL
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
        Users            Assignments       Status History
```

---

# Technology Stack

## Backend

* Python 3.11
* FastAPI
* SQLAlchemy
* PostgreSQL 16
* Alembic
* JWT
* Passlib
* bcrypt
* pytest

## Frontend

* React
* Vite
* Axios

## Infrastructure

* Docker
* Docker Compose

---

# User Roles

## Client

Clients can:

* Log in
* Create dataset requests
* View their own requests
* View request status
* Accept delivered requests
* Reject delivered requests

Clients cannot:

* View other clients' requests
* Import episodes
* Assign episodes
* Move requests into operational states such as `in_progress`

---

## Operator

Operators can:

* View all requests
* Move requests through the operational workflow
* Import episode metadata
* Filter episodes
* Assign episodes
* Deliver completed requests
* View analytics

---

## Admin

Admins have operator capabilities and are intended to additionally manage users and roles.

---

# Request Workflow

Valid transitions are:

```text
submitted
    |
    v
in_progress
    |
    v
delivered
    |
    +-------> accepted
    |
    v
 rejected
    |
    v
in_progress
```

More precisely:

```text
submitted -> in_progress

in_progress -> delivered

delivered -> accepted
delivered -> rejected

rejected -> in_progress
```

Invalid transitions are rejected by the backend.

For example:

```text
submitted -> delivered
submitted -> accepted
accepted -> submitted
accepted -> rejected
```

are not allowed.

---

# Status History

Every status change creates a record in `status_history`.

Each record stores:

* Request ID
* User who made the change
* Previous status
* New status
* Timestamp

This provides an audit trail for workflow changes.

---

# Episode Data

Episodes contain:

* `episode_id`
* `robot_id`
* `task_name`
* `recorded_at`
* `duration_seconds`
* `operator_name`
* `quality`

The provided dataset uses two quality values:

```text
good
bad
```

Only `good` episodes can be assigned to requests.

`bad` episodes are rejected by the assignment endpoint.

---

# Known Robots

The importer validates robot IDs against:

```text
arm-01
arm-02
arm-03
mobile-01
humanoid-01
```

Unknown robot IDs are rejected during import.

---

# Episode Assignment Rules

The backend enforces the following rules:

1. Only operators and admins can assign episodes.
2. Only `good` episodes can be assigned.
3. An episode can belong to only one request.
4. An episode's task must match the request's task.
5. A request cannot be delivered until enough episodes have been assigned.

The database also contains a unique constraint on `episode_id` in the assignments table.

This provides protection even if multiple requests attempt to assign the same episode.

---

# CSV Import

The system supports importing episode metadata from CSV.

The importer validates:

* Missing episode IDs
* Missing robot IDs
* Unknown robot IDs
* Missing task names
* Invalid quality values
* Invalid duration
* Negative duration
* Invalid timestamps
* Duplicate episode IDs

Example CSV structure:

```csv
episode_id,robot_id,task_name,recorded_at,duration_seconds,operator_name,quality
EP-00156,mobile-01,stack blocks,2026-08-16T23:28:00,78,Diane,good
```

---

# Idempotent Imports

The importer is safe to run multiple times.

`episode_id` is unique in the database.

If an imported episode already exists, it is skipped instead of creating a duplicate.

The importer returns:

```json
{
  "imported": 10,
  "skipped": 3,
  "reasons": []
}
```

This makes repeated imports safe.

---

# Authentication

Authentication uses JWT access tokens.

The login endpoint accepts:

```json
{
  "email": "client-a@example.com",
  "password": "client123"
}
```

Successful login returns:

```json
{
  "access_token": "...",
  "token_type": "bearer"
}
```

Protected endpoints require:

```text
Authorization: Bearer <token>
```

Passwords are stored as bcrypt hashes.

Passwords are never stored in plaintext.

---

# Seed Users

The development environment contains the following users:

| Email                                               | Password  | Role     |
| --------------------------------------------------- | --------- | -------- |
| [admin@example.com](mailto:admin@example.com)       | admin123  | admin    |
| [ops1@example.com](mailto:ops1@example.com)         | ops123    | operator |
| [ops2@example.com](mailto:ops2@example.com)         | ops123    | operator |
| [client-a@example.com](mailto:client-a@example.com) | client123 | client   |
| [client-b@example.com](mailto:client-b@example.com) | client123 | client   |

These credentials are for local development/testing only.

They must not be used in production.

---

# API Endpoints

## Health

```text
GET /health
```

Checks whether the API is running.

---

## Authentication

```text
POST /auth/login
```

Logs a user in and returns a JWT.

---

## Current User

```text
GET /users/me
```

Returns the authenticated user's profile.

---

## Requests

Create:

```text
POST /requests
```

List:

```text
GET /requests
```

Get one:

```text
GET /requests/{request_id}
```

Change status:

```text
PATCH /requests/{request_id}/status
```

---

## Episodes

List:

```text
GET /episodes
```

Optional filters:

```text
?task_name=stack
?quality=good
```

Import:

```text
POST /episodes/import
```

Assign:

```text
POST /episodes/{episode_id}/assign/{request_id}
```

---

## Analytics

Episodes per day per robot:

```text
GET /analytics/episodes-per-day
```

Request counts by status:

```text
GET /analytics/requests
```

Median submitted-to-delivered time:

```text
GET /analytics/delivery-time
```

Top five tasks among good episodes:

```text
GET /analytics/top-tasks
```

---

# Analytics

Analytics are performed in PostgreSQL rather than loading the full dataset into Python.

The platform supports:

### Episodes recorded per day per robot

Groups episodes by:

```text
date
robot
```

### Request fulfilment by status

Groups requests by their current status.

### Median submitted-to-delivered time

Uses PostgreSQL's percentile function to calculate the median duration.

### Top five tasks

Counts only episodes where:

```text
quality = good
```

Then groups by task and returns the five most frequent tasks.

---

# Database Design

Main tables:

```text
users
    |
    +---- requests
              |
              +---- assignments ---- episodes
              |
              +---- status_history
```

## Users

Stores authentication and role information.

## Requests

Stores dataset requests.

## Episodes

Stores robot recording metadata.

## Assignments

Connects episodes to requests.

The unique `episode_id` constraint ensures an episode cannot be assigned twice.

## Status History

Stores every workflow transition.

---

# Migrations

Alembic manages database schema changes.

Run:

```bash
alembic upgrade head
```

Create a new migration:

```bash
alembic revision --autogenerate -m "describe change"
```

---

# Local Development

## 1. Start PostgreSQL

From the project root:

```bash
docker compose up -d db
```

PostgreSQL is exposed locally on:

```text
localhost:5433
```

---

## 2. Activate the Python environment

```bash
cd backend
source venv/Scripts/activate
```

---

## 3. Install dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Run migrations

```bash
alembic upgrade head
```

---

## 5. Seed development users

```bash
python -m app.seed
```

---

## 6. Start the API

```bash
uvicorn app.main:app --reload
```

The API is available at:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

---

# Running the Frontend

Go to:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

The Vite development server will display its local URL in the terminal.

---

# Running With Docker

Build and start the system:

```bash
docker compose up --build
```

The system contains:

```text
PostgreSQL
FastAPI API
```

The frontend can be started separately during development.

---

# Testing

Run all automated tests:

```bash
cd backend
pytest
```

The tests focus on important system behavior including:

* Health endpoint
* Authentication
* Authorization
* Request ownership
* Status transitions
* Episode assignment
* Import idempotency

---

# Security

The application applies server-side authorization.

Important protections include:

### Authentication

Protected endpoints require a valid JWT.

### Role authorization

Operations that require an operator or admin role reject client requests.

### Client ownership

Clients can only access their own requests.

### Password security

Passwords are hashed using bcrypt.

### Workflow validation

Users cannot bypass the request state machine by directly sending arbitrary status values.

### Input validation

Pydantic validates request payloads before application logic processes them.

### Database constraints

Important uniqueness rules are also enforced by PostgreSQL.

---

# Scaling Considerations

The system is designed so that the main analytics are performed by PostgreSQL.

For approximately 5 million episodes:

* Keep indexes on frequently filtered columns.
* Use pagination for episode lists.
* Avoid loading entire tables into Python.
* Use database-side aggregation.
* Use connection pooling.
* Consider partitioning by recording date if required by production workload.
* Consider materialized views for expensive reporting queries.

At significantly larger scale, background jobs could be introduced for:

* Large CSV imports
* Dataset exports
* Expensive analytics
* Notifications

---

# Production Improvements

Before production deployment, I would add:

* Managed PostgreSQL
* HTTPS
* Secure secret management
* Strong production passwords
* Refresh-token strategy
* Rate limiting
* Structured JSON logs
* Centralized monitoring
* Error tracking
* Background processing
* Pagination
* Automated database backups
* CI/CD
* Production frontend hosting
* More comprehensive automated tests

---

# Project Structure

```text
dataset-request-desk/
│
├── backend/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── dependencies.py
│   │   │   └── security.py
│   │   │
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── episode.py
│   │   │   ├── request.py
│   │   │   ├── assignment.py
│   │   │   └── status_history.py
│   │   │
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── requests.py
│   │   │   ├── episodes.py
│   │   │   └── analytics.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── request.py
│   │   │   └── episode.py
│   │   │
│   │   ├── services/
│   │   │   ├── request_service.py
│   │   │   └── import_service.py
│   │   │
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── middleware.py
│   │   ├── main.py
│   │   └── seed.py
│   │
│   ├── migrations/
│   ├── tests/
│   ├── Dockerfile
│   ├── alembic.ini
│   ├── pytest.ini
│   └── requirements.txt
│
├── frontend/
│
├── seed/
│   └── episodes.csv
│
├── docker-compose.yml
├── README.md
├── NOTES.md
└── .gitignore
```

---

# Development Philosophy

The implementation intentionally prioritizes the required business rules over unnecessary features.

The most important guarantees are enforced by the backend and database rather than relying on frontend behavior.

The system can therefore be extended with a richer frontend without changing the core business logic.
