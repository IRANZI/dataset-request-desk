# Technical Notes

## 1. Design and Data Model

The application models five main entities:

### User

Represents authenticated platform users.

Important fields:

* email
* password_hash
* role
* name
* organisation
* is_active

### Request

Represents a client's dataset request.

Important fields:

* client_id
* task_name
* episodes_requested
* deadline
* notes
* status
* created_at

### Episode

Represents a robot recording.

Important fields:

* episode_id
* robot_id
* task_name
* recorded_at
* duration_seconds
* operator_name
* quality

### Assignment

Connects an episode to a request.

The database places a unique constraint on `episode_id`, ensuring that one episode cannot be assigned to multiple requests.

### StatusHistory

Stores every request status transition.

It records:

* request
* user who changed it
* previous status
* new status
* timestamp

---

## 2. Authentication and Authorization

JWT is used for authentication.

Passwords are stored using bcrypt hashes.

Authentication answers:

> Who is the user?

Authorization answers:

> Is this user allowed to perform this action?

These are handled separately.

Role checks are enforced by the FastAPI backend.

Clients also have an ownership check so that knowing another request's ID is not sufficient to access it.

---

## 3. Workflow Rules

The request state machine is:

```text
submitted -> in_progress
in_progress -> delivered
delivered -> accepted
delivered -> rejected
rejected -> in_progress
```

Invalid transitions are rejected.

Status changes are recorded in `status_history`.

This prevents the frontend from bypassing workflow rules by sending arbitrary status values.

---

## 4. Episode Assignment

The supplied CSV contains:

```text
good
bad
```

Only `good` episodes are eligible for assignment.

An episode is also required to have the same `task_name` as the request.

The unique constraint on `assignments.episode_id` prevents an episode from being assigned more than once.

A request cannot transition to `delivered` until it has at least the requested number of assigned episodes.

---

## 5. Import Design

The import operation validates incoming CSV records before creating episodes.

Validation includes:

* Required episode ID
* Known robot
* Task name
* Timestamp
* Duration
* Quality
* Duplicate episode ID

The importer can safely be run repeatedly.

Existing episode IDs are skipped instead of inserted again.

The import response includes:

* Number imported
* Number skipped
* Reasons for skipped records

---

## 6. Database Decisions

PostgreSQL was selected because the platform has strongly relational data.

Database constraints are used for important business rules instead of relying entirely on Python code.

Examples include:

```text
users.email UNIQUE
episodes.episode_id UNIQUE
assignments.episode_id UNIQUE
```

Indexes are placed on frequently queried fields such as:

```text
episode_id
robot_id
task_name
recorded_at
quality
request.status
request.client_id
```

---

## 7. Analytics

Analytics are intentionally executed in PostgreSQL.

The application does not load millions of episodes into Python and then calculate statistics in memory.

Examples include:

* `GROUP BY` for episodes per day and robot
* `COUNT` for request statuses
* `percentile_cont(0.5)` for median delivery time
* `GROUP BY` and `ORDER BY` for top task names

This approach allows PostgreSQL to use indexes and its query planner.

---

## 8. Scaling to 5 Million Episodes

At approximately five million episodes, I would:

1. Keep appropriate indexes.
2. Paginate episode listings.
3. Keep analytics database-side.
4. Use connection pooling.
5. Avoid returning unnecessary columns.
6. Consider date-based partitioning if query patterns justify it.
7. Consider materialized views for expensive recurring analytics.
8. Move large imports to background workers.

At 100x the current episode volume, I would also consider:

* Read replicas
* Partitioning
* Dedicated analytics tables
* Background processing
* Object storage for large exports

The exact solution should be based on actual production query patterns rather than adding infrastructure prematurely.

---

## 9. Security

### Password exposure

Passwords are never stored directly.

Only bcrypt password hashes are stored.

### Broken object-level authorization

A client could attempt:

```text
GET /requests/999
```

to access another client's request.

The API verifies that the authenticated client owns the request before returning it.

### Broken function-level authorization

Clients should not be able to call operational endpoints.

Role dependencies prevent clients from importing episodes or assigning them.

### Workflow manipulation

The backend validates status transitions independently of the frontend.

### Input validation

Pydantic validates incoming API data.

CSV import also performs explicit validation.

---

## 10. Simplifications

The implementation deliberately avoids overbuilding.

The initial system uses:

* Synchronous CSV import
* Simple JWT authentication
* A lightweight React frontend
* PostgreSQL
* REST endpoints

Possible production extensions include:

* Background imports
* Notifications
* Real-time updates
* Dataset export jobs
* Advanced monitoring
* More detailed user administration

---

## 11. Something That Went Wrong

During development, password hashing produced a bcrypt compatibility error.

The error appeared to suggest a password length problem even though the development passwords were short.

The actual issue was compatibility between the installed bcrypt version and Passlib.

The problem was diagnosed by inspecting the traceback and testing password hashing independently.

Compatible versions were pinned:

```text
passlib==1.7.4
bcrypt==4.0.1
```

This prevented the environment from depending on an incompatible bcrypt release.

---

## 12. AI Tooling

AI assistance was used for:

* Project structure
* Code generation
* Debugging
* API design
* Documentation
* Explaining implementation decisions
* Identifying edge cases

Generated code was reviewed and manually tested.

The important business rules were verified independently, especially:

* Authentication
* Authorization
* Request ownership
* Status transitions
* Episode assignment
* CSV validation
* Import idempotency

---

## 13. Future Improvements

If development continued, I would add:

* Complete admin user-management endpoints
* More comprehensive automated tests
* Frontend role-specific dashboards
* Better error handling
* Pagination
* Background imports
* WebSocket notifications
* CI/CD
* Production deployment
* Monitoring and alerting

These are intentionally separated from the core implementation so that the required platform remains small and understandable.
