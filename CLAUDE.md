# CLAUDE.md

This file gives Claude (and any other contributor) context on the project so it can generate consistent, on-spec code.

## Project Overview

**Name:** Deskly — Mini Helpdesk / Ticket Management System
**Type:** Technical interview assignment / portfolio project
**Goal:** A small role-based helpdesk app with two user types — Support User (manages own tickets) and Admin (manages all tickets, assignment, and statistics).

## Tech Stack

- **Frontend:** React.js
- **Backend:** FastAPI (Python)
- **Database:** SQLite
- **Auth:** JWT-based authentication
- **API style:** RESTful

## Core Requirements (do not change or drop these)

These are the assignment's non-negotiable requirements. Any improvement or refactor must preserve all of the following behavior.

### Support User
- Login with username/password → receives JWT
- Create a new ticket
- View only their own tickets ("My Tickets")
- View full details of their own ticket
- Update their ticket **only while status is Open**
- Delete/cancel their own ticket **only while status is Open**
- View ticket status: Open, In Progress, Closed

### Admin
- Login with username/password → receives JWT
- View all tickets from all users
- Search tickets by title and/or customer/user
- Filter tickets by status
- View full ticket details, including creator and assignment info
- Change ticket status: Open → In Progress → Closed
- Assign a ticket to a support user
- Delete a ticket
- View dashboard statistics (total, open, in progress, closed tickets; optionally by assigned user)

### Backend rules (must be enforced server-side, not just in the UI)
- Role-based authorization — users cannot hit admin endpoints
- Ownership enforcement — a support user can only access their own tickets
- Status-based edit/delete rules enforced on the backend
- Proper HTTP status codes: 400/401/403/404 as appropriate
- Passwords/sensitive auth data never exposed in responses

### API conventions
- Sensible REST endpoints, e.g. `/auth/login`, `/tickets`, `/tickets/{id}`, `/admin/tickets`
- Correct use of GET / POST / PUT or PATCH / DELETE
- Consistent JSON response structure
- Meaningful validation error messages

## Suggested Architecture

```
backend/
  app/
    main.py
    core/          # config, security (JWT), dependencies
    models/        # SQLAlchemy models (User, Ticket)
    schemas/       # Pydantic request/response schemas
    api/
      auth.py
      tickets.py       # support-user routes
      admin.py         # admin-only routes
    services/      # business logic (ticket rules, stats)
    db/            # session, init/seed script
  tests/
  requirements.txt

frontend/
  src/
    api/           # axios/fetch service layer per resource
    components/    # shared UI (Badge, Table, Modal, etc.)
    pages/
      Login.jsx
      support/
        MyTickets.jsx
        CreateTicket.jsx
        TicketDetails.jsx
      admin/
        Dashboard.jsx
        AllTickets.jsx
        TicketDetails.jsx
    context/       # auth context, role-based route guards
    App.jsx
  package.json

README.md
CLAUDE.md
```

## Coding Conventions

- Keep FastAPI routers thin — validation and request/response shape only; business logic (ownership checks, status-transition rules) lives in a `services/` layer so it's unit-testable and reused between support and admin routes where relevant.
- Use Pydantic schemas for every request/response — never return SQLAlchemy models directly.
- Centralize JWT creation/validation and role-checking in FastAPI dependencies (`get_current_user`, `require_admin`) rather than repeating checks in each route.
- On the frontend, keep API calls out of components — put them in an `api/` service layer, one file per resource (`ticketsApi.js`, `authApi.js`).
- Status transitions (Open → In Progress → Closed) should be validated in one place on the backend so the rule can't be bypassed by calling the API directly.
- Prefer explicit, readable code over cleverness — this is being evaluated for engineering judgment, not novelty.

## What NOT to change

- Don't merge the two roles into one flat permission model — the assignment specifically wants role-based authorization to be demonstrated.
- Don't move ownership/status validation to the frontend only.
- Don't replace SQLite — it's intentionally required so the reviewer can run the project with zero setup.
- Don't drop any of the core Support User or Admin requirements listed above, even when adding enhancements below.

---

## Suggested Improvements / Enhancements

These are optional, additive layers on top of the core spec — useful for standing out in review or extending the project afterward. Core functionality above must keep working exactly as specified regardless of which of these are added.

### From the assignment's own bonus list (do these first, in priority order)
1. Loading, empty, and error states throughout the UI
2. Frontend form validation (title required, description length, etc.)
3. Reusable, well-structured React components (Badge, Table, Modal, StatCard)
4. Dedicated API/service layer on the frontend
5. Backend unit/API tests (pytest + httpx)
6. Pagination for ticket lists
7. Responsive, polished UI
8. Confirmation dialogs for destructive actions (delete ticket)
9. Audit fields — `updated_by`, `status_changed_at` timestamps

### Beyond the assignment (nice-to-haves for a stronger portfolio piece)
- **Ticket comments/notes** — a simple activity thread on each ticket (support user and admin can leave notes), stored as a related table.
- **Email or in-app notifications** — notify a support user when their ticket is assigned or status changes (can be mocked/logged rather than a real email service).
- **Priority field** — Low/Medium/High on tickets, filterable on the admin side.
- **Category/tag field** — e.g. Billing, Technical, Account — useful for the dashboard stats and search.
- **Dark mode** — small UI polish, easy with Tailwind/shadcn.
- **CSV export** — let Admin export the filtered ticket list.
- **Refresh token / token expiry handling** — improves the JWT auth beyond the minimum.
- **Rate limiting on login** — basic brute-force protection, shows security awareness.
- **Dockerfile / docker-compose** — one-command local run for backend + frontend, on top of the required manual run instructions.
- **Seed script** — pre-populate a demo admin + a few support users and sample tickets so the reviewer can explore immediately after cloning.
- **Basic analytics on the dashboard** — average time-to-close, tickets closed this week, busiest support user.
- **Optimistic UI updates** — status changes and assignment reflect instantly in the admin table before the API confirms.

### Explicitly out of scope (don't add unless asked)
- Multi-tenant/organization support
- Real email/SMS integration
- File attachments on tickets (unless you have time and want to demonstrate file upload handling)
- Third-party OAuth login — the spec asks for username/password JWT auth specifically

## Definition of Done (for the core assignment)

- [ ] Both roles can log in and receive a valid JWT
- [ ] Support user CRUD + ownership + Open-only edit/delete rules work and are enforced on the backend
- [ ] Admin can view all tickets, search, filter, assign, change status, delete
- [ ] Dashboard shows total/open/in-progress/closed counts
- [ ] All endpoints return correct status codes and consistent JSON
- [ ] README includes setup, DB init, and run instructions for both frontend and backend
- [ ] Repo pushed and accessible, with assumptions/limitations documented
