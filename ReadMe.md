# Shared Asset Custody System

> A multi-organization, web-based platform to track ownership, transfer history, and availability of shared assets — laptops, cameras, projectors, tools, and more.

Built with a **Flask REST API** backend and a **React SPA** frontend. Every organization gets its own isolated workspace: one admin, their employees, and their assets — all fully separated from every other organization on the same platform.

---

## Project Description

Managing shared physical assets in an organization is messy. Spreadsheets get outdated, nobody knows who has the projector, and there is no record of who took what and when.

This system replaces that chaos with a structured, accountable, and auditable platform. It is designed for **multiple organizations** to use simultaneously — each org registers independently, manages its own team and inventory, and has a complete audit trail of every asset lifecycle event.

The core focus is on three things:

- **Clarity** — always know the current status and holder of every asset
- **Accountability** — every assignment and return is recorded with who did it and when
- **Auditability** — a tamper-evident, append-only log of every event in the system

---

## Quick Review — Organizational Model

The system is built around the concept of **Organizations**. Everything in the system belongs to an organization.

```
Organization
├── Admin (1 per org)         — manages employees and assets
├── Employees (many per org)  — receive and return assets
└── Assets (many per org)     — tracked with full lifecycle history
```

### How it works

1. An organization **registers** on the platform — this creates the org and its admin account in one step.
2. The admin **adds employees** from the Employees page. Each employee gets login credentials.
3. The admin **registers assets** into the inventory with a unique serial number and initial status.
4. Any user can **assign** an available asset to an employee, with optional notes.
5. Any user can **return** an assigned asset, making it available again.
6. Every action — create, assign, return, delete — is written to an **append-only audit log**.
7. Every user has a **profile** they can edit (name, phone, department, job title, password).

### Isolation guarantee

Each organization's data is completely isolated. An admin or employee of Org A can never see, access, or modify the users, assets, assignments, or history of Org B. Isolation is enforced at the database query level on every API route via `org_id` scoping.

| Table | Isolated by |
|-------|-------------|
| `organizations` | primary entity |
| `users` | `org_id` |
| `assets` | `org_id` |
| `asset_logs` | `org_id` |
| `assignments` | via `asset.org_id` |

Serial numbers are unique **per organization**, not globally — two orgs can both have a serial `SN-001` without conflict.

---

## Project Structure

```
DigiProject/
│
├── app.py                        # Flask app factory
├── config.py                     # JWT, DB, secret key config
├── extensions.py                 # SQLAlchemy, Bcrypt, JWTManager
├── seed.py                       # Populate dummy data (2 orgs)
├── seed_data.md                  # Human-readable reference of seed data
│
├── models/
│   ├── organization.py           # Organization model
│   ├── user.py                   # User model (with profile fields)
│   ├── asset.py                  # Asset model (org-scoped)
│   ├── assignment.py             # Assignment model
│   └── asset_log.py              # Append-only audit log
│
├── services/
│   └── asset_service.py          # Business logic (org-scoped)
│
├── routes/
│   ├── asset_routes.py           # Asset, assign, return, history APIs
│   ├── auth_routes.py            # Register, login, logout, profile, user mgmt
│   └── decorators.py             # admin_required, login_required, current_org_id
│
├── migrations/                   # Alembic schema versions
│
├── react_app/
│   ├── public/
│   └── src/
│       ├── api/client.js         # Centralised API + auth header injection
│       ├── context/AuthContext.js # Auth state, org state, token refresh
│       ├── components/
│       │   ├── Sidebar.js        # Role-aware nav + org name in footer
│       │   ├── ProtectedRoute.js # Auth + adminOnly route guard
│       │   ├── Toast.js          # Global notification system
│       │   ├── ConfirmModal.js   # Reusable confirmation dialog
│       │   ├── StatCard.js       # Dashboard stat card
│       │   ├── StatusBadge.js    # Asset status pill badge
│       │   └── QuickActionsWidget.js  # Floating action button + fleet health
│       ├── pages/
│       │   ├── LoginPage.js      # Sign In + Register Organization tabs
│       │   ├── Dashboard.js      # Asset table, stats, chart, search/filter
│       │   ├── AssignPage.js     # Assign asset form
│       │   ├── AddAssetPage.js   # Register new asset (admin only)
│       │   ├── InventoryPage.js  # Inventory overview + charts + delete
│       │   ├── HistoryPage.js    # Per-asset timeline + global activity feed
│       │   ├── EmployeesPage.js  # Add/delete employees (admin only)
│       │   └── ProfilePage.js    # View/edit own profile + change password
│       ├── App.js
│       ├── index.css
│       └── index.js
│
├── static/                       # Legacy CSS (Flask templates)
├── templates/                    # Legacy HTML templates
└── instance/                     # SQLite database (gitignored)
```

---

## Setup Instructions (Run Locally)

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/yash750/DigiProject.git
cd DigiProject
```

---

### 2. Backend Setup

**Create and activate a virtual environment**

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate
```

**Install Python dependencies**

```bash
pip install flask flask-sqlalchemy flask-migrate flask-jwt-extended flask-bcrypt
```

**Set environment variables** (optional — defaults work for local dev)

```bash
# Windows
set SECRET_KEY=your-secret-key
set JWT_SECRET_KEY=your-jwt-secret

# Mac / Linux
export SECRET_KEY=your-secret-key
export JWT_SECRET_KEY=your-jwt-secret
```

**Initialize and migrate the database**

```bash
flask db upgrade
```

> If this is a fresh clone with no `migrations/` folder, run these first:
> ```bash
> flask db init
> flask db migrate -m "initial schema"
> flask db upgrade
> ```

**Seed dummy data**

```bash
python seed.py
```

This creates 2 organizations with users, assets, assignments, and audit logs. See `seed_data.md` for all credentials and data details.

**Start the Flask server**

```bash
flask run
```

Flask runs on `http://127.0.0.1:5000`

---

### 3. Frontend Setup

Open a second terminal in the same project folder.

```bash
cd react_app
npm install
npm start
```

React runs on `http://localhost:3000` and proxies all API calls to Flask on port 5000.

---

### 4. Open the App

Navigate to `http://localhost:3000` in your browser.

Use any of the seeded credentials to log in:

| Organization | Role | Email | Password |
|---|---|---|---|
| TechNova Solutions | Admin | admin@technova.com | admin123 |
| TechNova Solutions | Employee | rahul@technova.com | password123 |
| BrightBridge Corp | Admin | admin@brightbridge.com | admin123 |
| BrightBridge Corp | Employee | priya@brightbridge.com | password123 |

Or register a brand new organization using the **Register Organization** tab on the login page.

---

## Application Pages

| Route | Access | Description |
|-------|--------|-------------|
| `/` | All users | Dashboard — asset stats, distribution chart, searchable asset table |
| `/assign` | All users | Assign an available asset to a team member |
| `/add-asset` | Admin only | Register a new asset into the inventory |
| `/inventory` | All users | Inventory overview with pie chart, stock levels, delete assets |
| `/history` | All users | Global activity feed — every event across all assets |
| `/history/:id` | All users | Full lifecycle timeline for a specific asset |
| `/employees` | Admin only | Add new employees, view and delete existing ones |
| `/profile` | All users | View and edit own profile, change password |
| `/login` | Public | Sign In or Register a new Organization |

---

## API Endpoints

### Authentication (`/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Create a new organization + admin account |
| POST | `/auth/login` | Public | Login with email + password, returns JWT tokens |
| POST | `/auth/refresh` | Refresh token | Get a new access token |
| POST | `/auth/logout` | Any user | Revoke current access token |
| GET | `/auth/me` | Any user | Get current user profile |
| GET | `/auth/profile` | Any user | Get profile with organization details |
| PATCH | `/auth/profile` | Any user | Update name, phone, department, job title, password |
| GET | `/auth/users` | Admin only | List all users in the organization |
| POST | `/auth/users` | Admin only | Create a new employee in the organization |
| DELETE | `/auth/users/<id>` | Admin only | Delete an employee |

### Assets (`/`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/assets` | Any user | List all assets in the organization |
| POST | `/assets` | Admin only | Register a new asset |
| DELETE | `/assets/<id>` | Admin only | Permanently delete an asset |
| GET | `/users` | Any user | List users (for assignment dropdowns) |
| POST | `/assign` | Any user | Assign an available asset to a user |
| POST | `/return/<id>` | Any user | Return an assigned asset |
| GET | `/asset/<id>/history/json` | Any user | Full lifecycle timeline for one asset |
| GET | `/activity/json` | Any user | Global activity feed (last 200 events) |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3, Flask |
| ORM | Flask-SQLAlchemy |
| Database | SQLite (dev) |
| Migrations | Flask-Migrate (Alembic) |
| Authentication | Flask-JWT-Extended |
| Password Hashing | Flask-Bcrypt |
| Frontend | React 18 |
| Routing | React Router DOM v6 |
| Charts | Recharts |
| Styling | Plain CSS with custom properties |

---

## Future Scope

### Authentication & Security
- **Email verification** on registration — confirm org admin email before activation
- **Password reset via email** — forgot password flow with time-limited reset links
- **Two-factor authentication (2FA)** — TOTP-based second factor for admin accounts
- **OAuth / SSO** — sign in with Google or Microsoft for enterprise orgs
- **Redis-backed token blocklist** — replace the in-memory set for multi-instance deployments

### Organization Management
- **Organization settings page** — edit org name, upload logo, set timezone
- **Multiple admins per org** — promote employees to admin role
- **Org-level activity dashboard** — usage analytics, asset utilization rates over time
- **Invite-based onboarding** — admin sends an email invite link instead of setting passwords manually

### Asset Management
- **Asset categories and tags** — group assets by type, location, or project
- **Bulk import via CSV** — register many assets at once from a spreadsheet
- **QR code / barcode generation** — print labels for physical assets
- **Asset photos** — attach an image to each asset record
- **Maintenance scheduling** — set maintenance due dates and get reminders
- **Asset depreciation tracking** — record purchase date, cost, and expected lifespan

### Assignment & Workflow
- **Request-based assignment** — employees request an asset; admin approves or rejects
- **Due date on assignments** — set an expected return date and flag overdue items
- **Email / push notifications** — notify on assignment, return reminder, overdue alert
- **Assignment notes history** — view all notes across the full assignment chain

### Reporting & Analytics
- **Exportable reports** — download asset inventory or history as CSV / PDF
- **Utilization heatmap** — visualize which assets are most/least used over time
- **Overdue asset report** — list all assignments past their expected return date

### Infrastructure & Scalability
- **PostgreSQL support** — swap SQLite for Postgres for production deployments
- **Docker + docker-compose** — containerize Flask + React for one-command setup
- **CI/CD pipeline** — GitHub Actions for automated testing and deployment
- **Rate limiting** — protect API endpoints from abuse
- **Audit log export** — download the full org audit trail for compliance

---

> Built as part of a Product Engineering / HCI assignment.  
> Focused on system design, real-world organizational modeling, and human-centered interface design.
