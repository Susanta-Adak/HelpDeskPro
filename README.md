# HelpDeskPro — Mini Helpdesk / Ticket Management System

A small role-based helpdesk app with two user types:

- **Support User** — creates, tracks, and comments on tickets; can also be assigned tickets by an admin or another agent, and can drive an assigned ticket through Open → In Progress → Closed
- **Admin** — manages all tickets, assignment, dashboard analytics, and user accounts

Built as a technical interview / portfolio project. See [`CLAUDE.md`](./CLAUDE.md) for the full assignment spec and engineering conventions this codebase follows.

## Tech Stack

| Layer    | Technology                                     |
|----------|-------------------------------------------------|
| Frontend | React (Vite, React Router, Tailwind CSS v4)     |
| Backend  | FastAPI (Python)                                |
| Database | SQLite                                          |
| Auth     | JWT (username/password login)                   |

## Key Features

- Role-based access enforced server-side (ownership, status transitions, admin-only routes)
- Tickets have priority, category, an optional file attachment (PNG/JPG/PDF, 10MB), and a comment thread
- A support user sees tickets they created **or** are assigned to; the creator can always edit, but only delete while Open; the current assignee (or an admin) can change status, with reopening a closed ticket restricted to admins
- Admin dashboard: ticket counts, a status donut chart, and per-agent workload
- Admin-managed user provisioning — no hardcoded passwords, no public self-registration; admins can also activate/deactivate any account (deactivated users are blocked at login and mid-session, and disappear from assignment dropdowns) (see below)

## Getting Started (Backend)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# copy the template and set your own bootstrap password
cp .env.example .env
# edit .env: set SEED_ADMIN_PASSWORD

python -m app.db.seed   # creates just the admin account; fails if the env var above isn't set
uvicorn app.main:app --reload
```

API docs: `http://127.0.0.1:8000/docs`. Run tests with `pytest -q`.

### Managing users

The seed script only bootstraps the one admin account — no demo support
users or sample tickets. Log in as that admin and use the **Users** page
(or `POST /admin/users`) to create support/admin accounts and start
creating tickets. From the same page, admins can deactivate/reactivate any
account; a deactivated user is rejected at login and on their next request
even mid-session, and is excluded from assignment dropdowns.

## Getting Started (Frontend)

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173, expects the backend at :8000 (see .env)
```

## Assumptions & Limitations

- No public self-registration — this is an internal tool, so accounts are admin-provisioned rather than open sign-up.
- JWTs are long-lived (24h by default) with no refresh-token flow.
- SQLite is used intentionally so the project runs with zero external setup; there's no migration tool, so schema changes require dropping and reseeding the local `.db` file.
- The frontend stores the JWT in `localStorage` (not an httpOnly cookie) for simplicity — fine for this project's scope, not production-grade token storage.
