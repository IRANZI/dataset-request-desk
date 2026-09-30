# Implementation Notes

## Architecture

The application is separated into three main services:

```text
React Frontend
      |
      | HTTP / REST
      ↓
FastAPI Backend
      |
      ↓
PostgreSQL
```

Docker Compose manages all three services.

---

## Authentication

Authentication uses JWT access tokens.

The login endpoint uses OAuth2-compatible form data:

```text
username
password
```

The returned JWT contains the authenticated user's ID.

Protected endpoints extract the user from the token and apply role-based permissions.

Passwords are hashed using bcrypt.

---

## Role Model

There are three roles:

### Client

Clients can:

* Create requests
* View their own requests
* Accept delivered requests
* Reject delivered requests

Clients cannot access operator/admin resources.

### Operator

Operators can:

* View requests
* Manage request workflow
* View episodes
* Import episodes
* Assign episodes
* Access analytics

### Admin

Administrators have all operator capabilities plus:

* Create users
* Change user roles
* Activate users
* Deactivate users

---

## Request State Machine

The request state machine is implemented explicitly in the backend.

```text
submitted → in_progress
in_progress → delivered
delivered → accepted
delivered → rejected
rejected → in_progress
```

Invalid transitions are rejected by the service layer.

Every successful status change creates a `StatusHistory` record.

---

## Episode Assignment

An episode can only be assigned once.

This is enforced at the database level using a unique constraint on:

```text
assignments.episode_id
```

The API also checks whether the episode is already assigned before creating an assignment.

Only `good` quality episodes are assignable.

The episode task must match the request task.

---

## CSV Import

The import service intentionally handles messy source data.

Normalization includes:

* Removing surrounding whitespace
* Lowercasing robot IDs
* Normalizing task-name whitespace
* Lowercasing quality values
* Supporting several date formats

Invalid records are skipped rather than preventing valid records from being imported.

Each skipped row includes a reason.

The database uniqueness constraint on `episode_id` helps guarantee idempotency.

---

## Import Result Example

A successful import returns a structure similar to:

```json
{
  "imported": 111,
  "skipped": 79,
  "reasons": []
}
```

The exact number of reasons depends on the contents of the imported CSV.

When the same dataset is imported again, existing episode IDs are skipped rather than duplicated.

---

## Analytics

Analytics are calculated from PostgreSQL queries rather than hardcoded frontend values.

Examples:

* Episode count
* Episodes per day per robot
* Requests grouped by status
* Median request delivery time
* Top five task names by good-quality episodes

This keeps analytics synchronized with the database.

---

## Frontend

The frontend uses:

* React
* React Router
* Axios
* Tailwind CSS
* Vite

The API token is stored in browser local storage for this assessment implementation.

Navigation items are displayed according to the authenticated user's role.

The interface includes responsive layouts for desktop and mobile.

---

## Docker

Docker Compose provides:

```text
db
api
frontend
```

The API waits for PostgreSQL to become healthy before starting.

The API container runs:

```text
Alembic migrations
        ↓
Seed users
        ↓
Uvicorn
```

The frontend container runs Vite on:

```text
0.0.0.0:5173
```

---

## Testing

The backend currently has automated tests covering:

* Invalid login
* Health endpoint
* Episode quality assignment rules
* Client request ownership
* Role restrictions
* Request state transitions
* Delivery requirements
* Client acceptance
* Client rejection
* Rejected request recovery

The current workflow test suite passes successfully.

---

## Known Development Considerations

The development configuration intentionally uses simple credentials and a development secret.

For production deployment:

* Replace the development secret
* Use stronger password policies
* Use HTTPS
* Move token storage to a more secure strategy where appropriate
* Restrict CORS origins
* Use production database credentials
* Add centralized logging
* Add rate limiting
* Add monitoring and alerting

These are deployment hardening steps rather than requirements for the assessment MVP.
