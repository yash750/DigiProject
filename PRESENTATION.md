# Shared Asset Custody System
## HCI Assignment Presentation

---

# Slide 1 — Title

## Shared Asset Custody System
### A Multi-Organization Web Platform for Physical Asset Management

> Built with Flask REST API + React SPA

**Course:** Human-Computer Interaction
**Focus:** System Design · Organizational Modeling · Human-Centered Interface Design

---

# Slide 2 — The Problem

## The Problem We Are Solving

> "Who has the projector?"
> "Which laptop is free?"
> "When did Rahul return the camera?"

**Nobody knows. Nobody tracks. Nobody is accountable.**

### What happens in most startups today:
- 📋 Spreadsheets that go out of date within days
- 💬 WhatsApp messages to find available equipment
- ❌ No record of who took what and when
- 😤 Assets go missing with no audit trail

### The cost:
- Wasted time chasing equipment
- No accountability when assets are lost
- No data to make purchasing decisions

---

# Slide 3 — Product Vision & Strategy

## Vision

> To eliminate operational chaos for growing teams through a simple, self-serve, multi-tenant SaaS platform that replaces spreadsheets and informal communication with structured tracking, accountability, and audit trails — monetized through a freemium-to-subscription model.

---

## Product Strategy — One Line

> To eliminate physical asset chaos for Indian tech startups through a simple, self-serve, multi-tenant SaaS platform that replaces spreadsheets and WhatsApp with structured tracking, accountability, and audit trails — monetized through a freemium-to-subscription model targeting 25,000+ startups.

---

## Three Core Value Propositions

| Value | What it means |
|---|---|
| **Clarity** | Always know the current status and holder of every asset |
| **Accountability** | Every action is recorded with who did it and when |
| **Auditability** | Tamper-evident, append-only log of every lifecycle event |

---

# Slide 4 — Organizational Model

## How the System is Structured

```
Organization
├── Admin (1 per org)
│     ├── Registers assets into inventory
│     ├── Adds and removes employees
│     ├── Approves or rejects asset requests
│     └── Assigns assets to employees
│
└── Employees (many per org)
      ├── Request available assets
      ├── Transfer held assets to colleagues
      ├── View assignment history
      └── Manage their own profile
```

### Isolation Guarantee
Every organization's data is **completely isolated**.
- Org A can never see, access, or modify Org B's data
- Enforced at the database level on every API call
- Serial numbers are unique **per organization**, not globally

---

# Slide 5 — Application Pages

## What the Application Includes

| Page | Who Can Access | Purpose |
|---|---|---|
| Dashboard | All users | Asset stats, chart, searchable table |
| Assign / Transfer | All users | Admin assigns; Employee transfers |
| Requests | All users | Request assets or view open board |
| Add Asset | Admin only | Register new asset into inventory |
| Inventory | All users | Stock levels, pie chart, delete assets |
| History | All users | Global activity feed + per-asset timeline |
| Employees | Admin only | Add and delete employee accounts |
| My Profile | All users | Edit profile, change password |
| Login | Public | Sign In or Register a new Organization |

---

# Slide 6 — Key Features

## Feature 1 — Multi-Organization Registration

- Any organization can **self-register** in one step
- Creates the organization and admin account simultaneously
- No sales process, no IT setup, no installation
- Each organization gets a fully isolated workspace

---

## Feature 2 — Role-Based Asset Management

**Admin can:**
- Register new assets with serial numbers
- Assign available assets to any employee
- Approve or reject employee asset requests
- Delete assets (with confirmation)
- Add and remove employees

**Employee can:**
- Request specific available assets (admin approves)
- Post global requests visible to all teammates
- Transfer assets they currently hold to a colleague
- View full assignment history

---

## Feature 3 — Asset Request System

Two types of requests:

**Specific Request**
- Employee picks an available asset from the list
- Request goes to admin inbox
- Admin approves → asset is automatically assigned
- Admin rejects → employee is notified

**Global Request**
- Employee describes the asset type they need
- Posted on the Open Board visible to all team members
- Any colleague holding that asset type can transfer it directly
- Replaces the informal "who has a spare laptop?" WhatsApp message

---

## Feature 4 — Append-Only Audit Log

Every lifecycle event is permanently recorded:

| Event | What is logged |
|---|---|
| Asset Created | Who added it, initial status |
| Asset Assigned | Who assigned it, to whom, notes |
| Asset Returned | Who returned it, timestamp |
| Asset Transferred | From whom, to whom, reason |
| Asset Deleted | Who deleted it, when |

- Records survive asset deletion (snapshots of name and serial)
- Filterable by event type on the History page
- Per-asset timeline shows the complete chain of custody

---

## Feature 5 — User Profiles

Every user has a profile with:
- Name, email, phone number
- Department and job title
- Password change (requires current password)
- Avatar with initials
- Organization name and slug

---

# Slide 7 — Technology Stack

## What We Built With

| Layer | Technology | Why |
|---|---|---|
| Backend | Python 3 + Flask | Lightweight, fast to build, REST-friendly |
| ORM | Flask-SQLAlchemy | Clean database abstraction, migration support |
| Database | SQLite (dev) | Zero setup for local development |
| Migrations | Flask-Migrate (Alembic) | Version-controlled schema changes |
| Authentication | Flask-JWT-Extended | Stateless JWT, access + refresh tokens |
| Password Hashing | Flask-Bcrypt | Industry-standard bcrypt hashing |
| Frontend | React 18 | Component-based SPA, fast UI updates |
| Routing | React Router DOM v6 | Client-side navigation |
| Charts | Recharts | Bar chart + pie chart for inventory analytics |
| Styling | Plain CSS + Custom Properties | No framework dependency, full control |

---

# Slide 8 — HCI Design Principles

## All 10 HCI Principles — Applied

---

### 1. User-Centered Design (UCD)
> Design driven by the needs and behaviours of actual users.

- Sidebar shows different links for admin vs employee
- Assign page shows a completely different interface per role
- Requests page adapts its tabs based on who is logged in
- Asset dropdown only shows available assets — irrelevant options removed
- Quick Actions Widget surfaces the 3 most frequent tasks on every page

---

### 2. Consistency
> Uniformity in design elements across the interface.

- All buttons use the same shape, colour, and hover behaviour everywhere
- Status badges (Available / Assigned / Maintenance / Retired) look identical on every page
- All form fields use the same height, border, focus colour, and label style
- Toast notifications always appear bottom-right with the same animation
- Every card uses the same background, border radius, and shadow

---

### 3. Feedback
> Clear responses to user actions.

- Toast notification confirms every action (assign, return, delete, save)
- Buttons change label during processing: "Assign Asset" → "Assigning…"
- Buttons are disabled during API calls to prevent double submission
- Fleet Health bar fills with animation and changes colour (green / amber / red)
- Active sidebar link is highlighted blue — user always knows where they are
- Loading spinner shown while data is being fetched

---

### 4. Simplicity
> Minimise unnecessary elements, focus on essential functions.

- Quick Actions Widget is a small button by default — panel only opens on click
- Login page has no sidebar or top bar — single focused task
- Stat cards show only: icon + number + label
- Add Asset form has only 3 fields — the minimum needed
- Empty states show one icon and one line of text — no clutter
- Employee pages hide all admin controls entirely

---

### 5. Hierarchy (Visual Hierarchy)
> Direct user attention to the most important information first.

- Dashboard: Stats → Chart → Table (summary to detail)
- Stat card values are large and bold; labels are small and muted
- Quick Actions Widget: Health bar → Actions → Footer (critical to least critical)
- Page headers: Icon → Bold Title → Small Muted Subtitle
- Table headers are uppercase, small, and muted — subordinate to data rows
- Sidebar: Logo at top → Navigation in middle → User identity at bottom

---

### 6. Accessibility
> Designs usable by differently-abled people.

- **Skip-to-content link** — first focusable element, for keyboard users
- **role="main"** on content area — screen reader landmark
- **htmlFor / id pairing** on all form labels — screen reader announces correct label
- **role="alert"** on error messages — announced immediately by screen readers
- **aria-label** on icon-only buttons (logout, avatar, FAB)
- **aria-expanded** on Quick Actions Widget FAB
- **Escape key** closes the Confirm Delete modal
- Status badges use **colour + text** — never colour alone (colour-blind safe)
- Visible **blue focus ring** on all keyboard-focused inputs

---

### 7. Aesthetic Integrity
> Balance between visual beauty and practical functionality.

- Restrained palette: one primary blue, semantic status colours, clean backgrounds
- Tinted badge backgrounds (soft green, soft blue) — readable without harsh fills
- Cards use subtle shadow + 12px border radius — depth without heavy borders
- Inter typeface — designed specifically for screen readability
- Page headers use a coloured icon block — decorative and functional
- Light and Dark themes both maintain the same contrast ratios
- Login page: centred, generous padding, single brand icon — calm first impression

---

### 8. Affordance
> Design elements visually indicating how they should be used.

- FAB has raised shadow + scales up on hover — signals "press me"
- FAB icon changes ⚡ → ✕ when open — signals toggle state
- All buttons darken on hover — confirms they are clickable
- Input fields highlight blue on focus — signals active input
- "🔒 Return first" with not-allowed cursor — communicates unavailability
- Verb-first button labels: "Assign Asset", "Transfer", "Delete" — outcome is clear
- Eye icon toggle (👁 / 🙈) on password field — universally understood
- Ghost buttons = secondary actions; filled blue buttons = primary actions

---

### 9. Flexibility
> Users should be able to customise the interface.

- **Light / Dark theme switcher** in the top bar — saved to browser
- **Dashboard search + filter state** saved to browser — persists across navigation
- **Combined search and filter** — find assets by name AND status simultaneously
- **History page dual mode** — global feed or per-asset timeline from same link
- **Optional notes** on assignments and transfers — quick or detailed workflows
- **Responsive layout** — sidebar hides on mobile, grids collapse to single column
- **Quick Actions Widget** — persistent shortcut from any page

---

### 10. Error Prevention and Recovery
> Prevent mistakes. Help users fix errors.

**Prevention:**
- Asset dropdown only shows available assets — can't assign unavailable ones
- Two-step delete confirmation with explicit irreversibility warning
- "🔒 Return first" blocks deletion of assigned assets at UI level
- Duplicate pending requests for same asset blocked
- Employee cannot fulfil their own request

**Recovery:**
- Inline per-field error messages — specific, not generic
- Error messages clear as user corrects the field
- Current password required before changing password
- Confirm password field catches typos
- Human-readable API error messages in toast notifications
- Escape key / backdrop click dismisses the delete modal

---

# Slide 9 — Database Schema

## Data Model

```
organizations          users                  assets
──────────────         ──────────────         ──────────────
id (PK)                id (PK)                id (PK)
name                   org_id (FK)            org_id (FK)
slug (unique)          name                   name
created_at             email (unique)         serial_number
                       password_hash          status
                       role (admin/employee)
                       phone
                       department
                       job_title

assignments            asset_logs             asset_requests
──────────────         ──────────────         ──────────────
id (PK)                id (PK)                id (PK)
asset_id (FK)          org_id (FK)            org_id (FK)
assigned_to_user_id    event                  requested_by_id (FK)
assigned_by_user_id    asset_id (nullable)    asset_id (nullable)
assigned_at            asset_name (snapshot)  asset_name
returned_at            serial_number          note
notes                  actor                  status
                       detail                 resolved_by_id (FK)
                       timestamp              created_at
```

**Key design decisions:**
- `asset_id` in `asset_logs` is nullable — history survives asset deletion
- `asset_name` and `serial_number` are snapshots — not foreign keys
- `returned_at = NULL` means currently assigned
- Serial numbers unique per org, not globally

---

# Slide 10 — Future Scope

## What Comes Next

### Short Term
- Email verification on registration
- Password reset via email
- Due dates on assignments with overdue alerts
- Email notifications for assignments and returns

### Medium Term
- CSV bulk import for assets
- QR code / barcode label generation
- Exportable audit log (CSV / PDF)
- Asset photos and categories

### Long Term
- Multiple admins per organization
- OAuth / SSO (Google, Microsoft)
- PostgreSQL for production deployments
- Docker + docker-compose for one-command setup
- Freemium subscription tiers with usage limits

---

# Slide 11 — Demo Credentials

## Try It Yourself

| Organization | Role | Email | Password |
|---|---|---|---|
| TechNova Solutions | Admin | admin@technova.com | admin123 |
| TechNova Solutions | Employee | rahul@technova.com | password123 |
| TechNova Solutions | Employee | sneha@technova.com | password123 |
| BrightBridge Corp | Admin | admin@brightbridge.com | admin123 |
| BrightBridge Corp | Employee | priya@brightbridge.com | password123 |

**Or register a brand new organization** using the Register Organization tab on the login page.

### GitHub Repository
`https://github.com/yash750/DigiProject`

---

# Slide 12 — Summary

## What We Built

✅ Multi-organization SaaS platform with full data isolation
✅ Role-based access control (Admin + Employee)
✅ Complete asset lifecycle management (create → assign → return → delete)
✅ Employee asset request system (specific + global open board)
✅ Peer-to-peer asset transfer between employees
✅ Append-only audit log with full history timeline
✅ User profiles with editable fields
✅ Light / Dark theme switcher
✅ Fully responsive layout
✅ All 10 HCI Design Principles implemented and documented

---

> **Built as part of a Product Engineering / HCI Assignment**
> Focused on system design, real-world organizational modeling, and human-centered interface design.
