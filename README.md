# Dataset Request Desk
Live at : https://dataset-request-desk-1.onrender.com/  (frontend)
          https://dataset-request-desk.onrender.com  (Backend)
A full-stack dataset request management platform for managing robot-episode datasets from request creation through delivery and client acceptance.

The system supports three roles:

* **Client** — creates dataset requests and accepts or rejects delivered requests.
* **Operator** — manages requests, imports episode metadata, assigns episodes, and delivers completed requests.
* **Admin** — has all operator capabilities plus user management.

---

## Features

### Authentication & Authorization

* JWT-based authentication
* Secure password hashing with bcrypt
* Role-based access control
* Protected API endpoints
* Active/inactive user accounts

### Client Requests

Clients can:

* Create dataset requests
* View their own requests
* View request status
* Accept delivered requests
* Reject delivered requests

Request fields:

* Task name
* Number of episodes requested
* Deadline
* Notes

### Request Workflow

Requests follow this workflow:

```text
submitted
    ↓
in_progress
    ↓
delivered
    ↓
accepted
```

A delivered request can also be rejected:

```text
delivered
    ↓
rejected
    ↓
in_progress
```

Every status change is recorded in the status history table with:

* Request
* Previous status
* New status
* User who made the change
* Timestamp

### Episode Management

Operators and administrators can:

* View imported episodes
* Filter episodes by task
* Filter episodes by quality
* Import episode CSV files
* Assign episodes to requests

An episode can belong to only one request.

Only episodes with:

```text
quality = good
quality = usable

```

can be assigned.

The episode task must also match the request task.

### CSV Import

The importer validates and normalizes incoming episode data.

Validation includes:

* Required fields
* Known robot IDs
* Valid dates
* Valid duration
* Operator name
* Valid quality
* Duplicate episode IDs
* Malformed rows

Known robots:

```text
arm-01
arm-02
arm-03
mobile-01
humanoid-01
```

Accepted quality values:

```text
good
bad
usable
```

Quality values are normalized to lowercase before validation.

For example:

```text
Good → good
```

Invalid values such as:

```text
usable
excellent
blank
```

are skipped.

The importer reports:

* Number imported
* Number skipped
* Reason for each skipped row

The import is idempotent. Importing the same valid episode twice does not create duplicate database records.

### Delivery Rules

An operator cannot mark a request as delivered until the required number of episodes has been assigned.

For example:

```text
Required: 5 episodes
Assigned: 3 episodes

Delivery → rejected
```

Once enough valid episodes are assigned:

```text
Required: 5 episodes
Assigned: 5 episodes

Delivery → allowed
```

---

# Analytics

The system provides database-backed analytics for operators and administrators.

### Episodes per day per robot

Returns episode counts grouped by:

* Date
* Robot

### Requests by status

Returns request counts grouped by status.

### Median delivery time

Calculates the median time between:

```text
request creation → delivered
```

using PostgreSQL's percentile calculation.

### Top task names

Returns the top five task names based on the number of good-quality episodes.

---

# Technology Stack

## Backend

* Python 3.11
* FastAPI
* SQLAlchemy
* PostgreSQL
* Alembic
* Pydantic
* JWT
* Passlib / bcrypt
* Pytest

## Frontend

* React
* Vite
* Tailwind CSS
* Axios
* React Router
* Afacad font

## Infrastructure

* Docker
* Docker Compose
* PostgreSQL Docker container

---

# Project Structure

```text
dataset-request-desk/
│
├── backend/
│   ├── app/
│   │   ├── auth/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── middleware.py
│   │   ├── main.py
│   │   └── seed.py
│   │
│   ├── migrations/
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   └── start.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── vite.config.js
│
├── seed/
│   └── episodes.csv
│
├── docker-compose.yml
├── README.md
└── NOTES.md
```

---

# Running with Docker

Make sure Docker Desktop is running.

From the project root:

```bash
docker compose up --build
```

The services are available at:

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:8000
```

Swagger API documentation:

```text
http://localhost:8000/docs
```

Health check:

```text
http://localhost:8000/health
```

Expected health response:

```json
{
  "status": "healthy",
  "service": "dataset-request-desk-api"
}
```

To stop the services:

```bash
docker compose down
```

Do not use:

```bash
docker compose down -v
```

unless you intentionally want to delete the PostgreSQL data volume.

---

# Running the Backend Locally

Create and activate a virtual environment:

```bash
cd backend
python -m venv venv
```

Windows Git Bash:

```bash
source venv/Scripts/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Make sure PostgreSQL is running and configure:

```text
backend/.env
```

Then run migrations:

```bash
alembic upgrade head
```

Seed users:

```bash
python -m app.seed
```

Start the API:

```bash
uvicorn app.main:app --reload
```

---

# Running the Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

The API URL can be configured using:

```text
VITE_API_URL
```

---

# Test Accounts

The development seed creates the following accounts.

### Admin

```text
Email: admin@example.com
Password: admin123
Role: admin
```

### Operator

```text
Email: ops1@example.com
Password: ops123
Role: operator
```

### Operator 2

```text
Email: ops2@example.com
Password: ops123
Role: operator
```

### Client

```text
Email: client-a@example.com
Password: client123
Role: client
```

### Client 2

```text
Email: client-b@example.com
Password: client123
Role: client
```

These credentials are intended for local development and testing only.

---

# Testing

The backend uses Pytest.

From the `backend` directory:

```bash
pytest -v
```

The test suite covers:

* Authentication
* Health endpoint
* Role-based access
* Client request ownership
* Status transitions
* Delivery requirements
* Episode quality rules
* Episode assignment
* Client acceptance
* Client rejection
* Rejected request recovery

---

# API Overview

### Authentication

```text
POST /auth/login
```

### Users

```text
GET    /users/me
GET    /users
POST   /users
PATCH  /users/{user_id}/role
PATCH  /users/{user_id}/active
```

### Requests

```text
POST   /requests
GET    /requests
GET    /requests/{request_id}
PATCH  /requests/{request_id}/status
```

### Episodes

```text
GET  /episodes
POST /episodes/import
POST /episodes/{episode_id}/assign/{request_id}
```

### Analytics

```text
GET /analytics/summary
GET /analytics/episodes-per-day
GET /analytics/requests
GET /analytics/top-tasks
GET /analytics/delivery-time
```

### Health

```text
GET /health
```

---

# Security and Data Integrity

The application includes:

* Password hashing
* JWT authentication
* Role-based endpoint protection
* Client request ownership checks
* Episode uniqueness
* Assignment uniqueness
* Status transition validation
* Delivery completeness validation
* CSV validation
* Idempotent episode imports

---

# Development Notes

This project was built as a technical assessment for a dataset request management system.

The implementation prioritizes:

1. Correct business rules
2. Data integrity
3. Clear role separation
4. API validation
5. Testability
6. Dockerized development
7. Responsive frontend usability

The frontend is designed to provide a professional dashboard experience while keeping the interface simple and responsive across desktop and mobile screen sizes.
