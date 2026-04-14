# Features Document — Shared Asset Custody System

> Full codebase analysis of the Flask backend + React frontend.

---

## Table of Contents

1. [Functional Features](#1-functional-features)
   - 1.1 Authentication & Authorization
   - 1.2 Asset Management
   - 1.3 Assignment Management
   - 1.4 Return Management
   - 1.5 Audit Log & History
   - 1.6 Inventory & Analytics
   - 1.7 Dashboard
   - 1.8 Quick Actions Widget
   - 1.9 User Management
2. [Non-Functional Features](#2-non-functional-features)
   - 2.1 Security
   - 2.2 Performance
   - 2.3 Reliability & Data Integrity
   - 2.4 Usability
   - 2.5 Maintainability
   - 2.6 Scalability
   - 2.7 Accessibility
   - 2.8 Responsiveness
3. [API Reference](#3-api-reference)
4. [Technology Stack](#4-technology-stack)
5. [Database Schema](#5-database-schema)

---

## 1. Functional Features

### 1.1 Authentication & Authorization

**Login**
- Users authenticate via email and password through `POST /auth/login`.
- Passwords are stored as bcrypt hashes (`flask-bcrypt`); plain-text passwords are never stored.
- On success, the server returns a short-lived JWT access token (1 hour) and a long-lived refresh token (7 days), plus the user object.
- The React frontend (`AuthContext.js`) stores tokens in `localStorage` and attaches the `Authorization: Bearer <token>` header to every API request via `client.js`.

**Session Persistence**
- On app load, `AuthContext` validates the stored access token against `GET /auth/me`. If expired, it silently calls `POST /auth/refresh` using the refresh token to obtain a new access token — no user action required.
- The access token is automatically refreshed every 50 minutes via a `setInterval` timer, keeping sessions alive for active users.

**Logout**
- `POST /auth/logout` adds the token's `jti` (JWT ID) to an in-memory blocklist, immediately invalidating it server-side.
- The frontend clears all tokens and user data from `localStorage`.
- The sidebar logout button redirects to `/login` after logout.

**Role-Based Access Control (RBAC)**
- Two roles exist: `admin` and `employee`.
- The `admin_required` decorator (`decorators.py`) verifies the JWT and checks `role == "admin"` before allowing access to protected routes.
- The `login_required` decorator allows any authenticated user (admin or employee).
- Admin-only actions: creating assets (`POST /assets`), deleting assets (`DELETE /assets/<id>`).
- Employee-level actions: assigning assets, returning assets, viewing history and inventory.
- The React `ProtectedRoute` component enforces route-level access: unauthenticated users are redirected to `/login`; non-admin users attempting `/add-asset` are redirected to `/`.
- The sidebar dynamically hides the "Add Asset" link for non-admin users.

**Protected Route Redirect**
- When an unauthenticated user tries to access any protected page, they are redirected to `/login` with the original destination saved in `location.state.from`, and returned there after successful login.

---

### 1.2 Asset Management

**Register a New Asset (Admin Only)**
- Admins can add a new asset via the "Add Asset" page (`/add-asset`) or `POST /assets`.
- Required fields: `name` (string) and `serial_number` (string, must be unique).
- Optional field: `status` (defaults to `available` if not provided).
- The service layer (`asset_service.py`) validates that the serial number is unique before inserting; duplicate serial numbers raise a `ValueError` returned as a `400` response.
- On creation, an `AssetLog` entry with `event = "created"` is written, recording the initial status.
- The React form (`AddAssetPage.js`) validates client-side: empty name, empty serial number, and invalid characters in the serial number are caught before the API call, with inline error messages per field.

**Asset Status Lifecycle**
- Every asset has one of four statuses at any time:
  - `available` — ready to be assigned
  - `assigned` — currently held by a user
  - `maintenance` — undergoing repair, cannot be assigned
  - `retired` — decommissioned, cannot be assigned
- Status transitions are enforced by the service layer: only `available` assets can be assigned.

**Delete an Asset (Admin Only)**
- Admins can permanently delete an asset from the Inventory page.
- The service layer blocks deletion of `assigned` assets — the user must return the asset first.
- Deletion cascades to all related `Assignment` records (`cascade="all, delete-orphan"` on the SQLAlchemy relationship).
- Before deletion, a `AssetLog` entry with `event = "deleted"` is written (with `asset_id = None`) so the audit trail survives the deletion.
- The React UI requires a two-step confirmation via `ConfirmModal` before the API call is made, with an explicit warning that the action is permanent.
- Assigned assets show a locked "🔒 Return first" label instead of a delete button, preventing the action at the UI level.

---

### 1.3 Assignment Management

**Assign an Asset**
- Any authenticated user can assign an asset via the "Assign Asset" page (`/assign`) or `POST /assign`.
- Required fields: `asset_id`, `to_user_id` (recipient), `by_user_id` (assigner).
- Optional field: `notes` (free-text remarks about the assignment, max 255 characters).
- The service layer uses `SELECT ... FOR UPDATE` (row-level lock) on the asset row to prevent race conditions where two users try to assign the same asset simultaneously.
- Only assets with `status = "available"` can be assigned; attempting to assign an unavailable asset raises a `ValueError` returned as `400`.
- On success: an `Assignment` record is created with `assigned_at` timestamp; the asset's `status` is updated to `assigned`; an `AssetLog` entry with `event = "assigned"` is written.
- The React form pre-filters the asset dropdown to show only `available` assets, preventing the user from even attempting to assign an unavailable one.
- The form validates that all three required fields are filled before submitting.
- On success, a toast notification confirms the assignment and the user is redirected to the Dashboard.

**Current Holder Tracking**
- The `Asset.current_holder` property dynamically queries the `assignments` table for the most recent open assignment (`returned_at = NULL`) and returns the associated `User` object.
- This derived property is included in `Asset.to_dict()` and surfaced in the Dashboard and Inventory tables as the "Current Holder" column.

---

### 1.4 Return Management

**Return an Asset**
- Any authenticated user can mark an asset as returned via the Dashboard's "↩ Return" button or `POST /return/<asset_id>`.
- The service layer finds the active assignment (`returned_at = NULL`) for the asset and sets `returned_at` to the current UTC timestamp.
- The asset's `status` is updated back to `available`.
- An `AssetLog` entry with `event = "returned"` is written, recording the holder's name.
- If the asset has no active assignment, a `ValueError` is raised.
- The React Dashboard shows the "↩ Return" button only for assets with `status = "assigned"`, hiding it for all other statuses.
- While the return API call is in progress, the button shows `"…"` and is disabled to prevent double-submission.
- On success, a toast notification confirms the return and the asset list refreshes automatically.

---

### 1.5 Audit Log & History

**Per-Asset Timeline**
- `GET /asset/<id>/history/json` returns a unified, chronologically sorted timeline for a single asset.
- The timeline merges two data sources:
  - `Assignment` records: each entry shows who assigned the asset, who received it, when it was assigned, when it was returned (if applicable), and any notes.
  - `AssetLog` records: `created` and `deleted` events that have no corresponding assignment row.
- The timeline is sorted newest-first.
- The React `HistoryPage` renders each event with a colour-coded dot, an event badge (icon + label), and formatted timestamps.
- A "← Back" button returns the user to the Dashboard.
- The asset's name, serial number, and current status are shown at the top of the timeline.

**Global Activity Feed**
- `GET /activity/json` returns the 200 most recent `AssetLog` entries across all assets, newest-first.
- The React `HistoryPage` (when accessed without an `assetId` parameter) renders this as a filterable feed.
- Users can filter by event type: All / Added / Assigned / Returned / Deleted.
- Clicking an asset name in the feed navigates to that asset's individual timeline.
- The `AssetLog` table stores `asset_name` and `serial_number` as snapshots, so history entries remain readable even after an asset is deleted.

**Audit Log Design**
- The `AssetLog` model is append-only — records are never updated or deleted.
- Every lifecycle event (create, assign, return, delete) writes a log entry via the `_log()` helper in `asset_service.py`.
- Each log entry captures: event type, asset ID (nullable), asset name snapshot, serial number snapshot, actor name, human-readable detail string, and UTC timestamp.

---

### 1.6 Inventory & Analytics

**Inventory Overview Page**
- The `/inventory` page provides a consolidated view of all assets grouped by type.
- A per-type summary table shows: total units, available units, assigned units, maintenance units, and a stock status label (Full Stock / Partially In Use / Out of Stock).
- A pie chart (Recharts `PieChart`) visualises the breakdown of all assets by status (available / assigned / maintenance / retired).
- A "Quick Stats" panel shows total asset types, total units, available units, assigned units, and units in maintenance as a vertical key-value list.
- Individual assets are listed in a full table with a delete action per row.

**Dashboard Asset Distribution Chart**
- The Dashboard includes a bar chart (Recharts `BarChart`) showing the number of units per asset type (e.g., 3 Dell Laptops, 2 Canon Cameras).
- Each bar is colour-coded with a rotating palette of 5 colours.
- The chart only renders when there is data (`chartData.length > 0`).

**Stock Status Labels**
- The inventory summary table computes a stock status label per asset type:
  - "Full Stock" (green) — all units available
  - "Partially In Use" (blue) — some units assigned
  - "Out of Stock" (red) — zero units available

---

### 1.7 Dashboard

**Asset Summary Statistics**
- Four stat cards at the top of the Dashboard show: Total Assets, Available, Currently Assigned, and In Maintenance — each with a colour-coded icon.
- Counts are computed client-side from the full asset list returned by `GET /assets`.

**Asset Table**
- A full table lists all assets with columns: index, name, serial number, status badge, current holder, and actions.
- The table supports live search across asset name, serial number, and current holder name simultaneously.
- A status filter dropdown allows filtering by: All / Available / Assigned / Maintenance / Retired.
- Search and filter work together — both conditions must match for an asset to appear.
- A counter shows "X of Y assets shown" reflecting the current filter state.
- Each row has a "History" button that navigates to that asset's timeline.
- Assigned assets additionally show a "↩ Return" button.

**Loading and Empty States**
- While assets are loading, a centered spinner is shown in place of the table.
- If no assets match the current search/filter, an empty state with an icon and message is shown instead of an empty table.

---

### 1.8 Quick Actions Widget

**Floating Action Button (FAB)**
- A persistent circular button (`⚡`) is fixed to the bottom-right corner of every page in the application.
- Clicking it toggles a compact panel open/closed.
- The FAB icon changes to `✕` when the panel is open, and the button colour shifts from blue to slate.

**Fleet Health Bar**
- Every time the panel opens, it fetches live asset data from `GET /assets` and computes the fleet health percentage: `(available / total) × 100`.
- A progress bar fills to the health percentage with a smooth CSS transition.
- The bar and percentage are colour-coded: green (≥60%), amber (≥30%), red (<30%).
- While loading, a pulsing animated dot replaces the percentage.
- Mini stat badges show the exact counts: free / out / in maintenance.

**Quick Navigation**
- Four action buttons in the panel navigate to: Assign Asset, Add New Asset, View History, Inventory.
- Clicking any button closes the panel first, then navigates — preventing the panel from appearing on the new page.
- The panel is available on every route (mounted outside the `<Routes>` block in `App.js`).

---

### 1.9 User Management

**User Listing**
- `GET /users` returns all users as a JSON array with `id` and `name` fields, used to populate the dropdowns on the Assign Asset form.

**User Roles**
- Users have a `role` field: `"admin"` or `"employee"` (default).
- Role is embedded in the JWT as an additional claim and checked server-side on every protected request.
- Role is also stored in `localStorage` and used client-side to control UI visibility (sidebar links, route access).

**Seed Scripts**
- `seed.py` populates the database with 4 test users and 4 assets with sample assignments.
- `seed_auth.py` creates a default admin account (`admin@company.com / admin123`) and sets a default password (`password123`) for all existing users without a password hash.

---

## 2. Non-Functional Features

### 2.1 Security

**Password Hashing**
- All passwords are hashed with bcrypt via `flask-bcrypt` before storage. The `password_hash` column stores only the hash; the plain-text password is never persisted.

**JWT Authentication**
- Access tokens expire after 1 hour (`JWT_ACCESS_TOKEN_EXPIRES = 3600`).
- Refresh tokens expire after 7 days (`JWT_REFRESH_TOKEN_EXPIRES = 86400 * 7`).
- JWT secret keys are read from environment variables (`JWT_SECRET_KEY`), with insecure dev defaults that must be overridden in production.
- Logged-out tokens are added to an in-memory blocklist (`_blocklist` set in `auth_routes.py`), preventing reuse of revoked tokens.
- Custom JWT error handlers return structured JSON responses for expired, revoked, and missing tokens (401 status codes).

**Role Enforcement (Server-Side)**
- Role checks are performed server-side on every request via the `admin_required` and `login_required` decorators — client-side role hiding is a UX convenience only, not a security boundary.

**CORS Configuration**
- CORS headers are set in `app.py` via `@app.after_request`, restricting `Access-Control-Allow-Origin` to `http://localhost:3000` (the React dev server).
- Allowed methods: `GET, POST, DELETE, OPTIONS`. Allowed headers: `Content-Type, Authorization`.
- `OPTIONS` preflight requests are handled explicitly in `@app.before_request`.

**Input Validation**
- Server-side: the service layer validates required fields, serial number uniqueness, and asset status before any database write. `ValueError` exceptions are caught in route handlers and returned as `400` responses.
- Client-side: `AddAssetPage` validates name, serial number presence, and serial number character set (`/^[A-Za-z0-9\-_]+$/`) before submitting. `AssignPage` checks all required dropdowns are selected.

**Secret Key Management**
- `SECRET_KEY` and `JWT_SECRET_KEY` are loaded from environment variables with insecure fallback defaults clearly labelled `"dev-key-please-change-in-production"`.

---

### 2.2 Performance

**Database Indexing**
- A composite index `idx_asset_active` on `(asset_id, returned_at)` in the `assignments` table optimises the most frequent query: finding the active (open) assignment for an asset.
- Individual indexes on `asset_id`, `assigned_to_user_id`, and `assigned_by_user_id` in the `assignments` table speed up foreign key lookups.

**Row-Level Locking**
- `assign_asset()` uses `SELECT ... FOR UPDATE` (`with_for_update()`) on the asset row to prevent concurrent assignment of the same asset, avoiding race conditions under concurrent load.

**Efficient ORM Queries**
- `Asset.current_holder` uses a targeted `.filter_by(returned_at=None).first()` query rather than loading all assignments.
- The global activity feed is capped at 200 records (`.limit(200)`) to prevent unbounded result sets.

**React Client-Side Filtering**
- Search and status filtering on the Dashboard are performed entirely client-side on the already-fetched asset list, avoiding additional API calls on every keystroke.

**Proxy Configuration**
- The React app's `package.json` sets `"proxy": "http://localhost:5000"`, routing all API calls through the dev server without CORS issues during development.

---

### 2.3 Reliability & Data Integrity

**Immutable Audit Trail**
- The `AssetLog` table is append-only. No log entries are ever updated or deleted, ensuring a tamper-evident record of every lifecycle event.
- Log entries snapshot `asset_name` and `serial_number` at the time of the event, so history remains readable even after the asset is deleted.

**Cascade Deletion**
- The `Asset` → `Assignment` relationship uses `cascade="all, delete-orphan"`, ensuring all assignment records for a deleted asset are removed atomically.

**Transaction Safety**
- All service functions (`create_asset`, `delete_asset`, `assign_asset`, `return_asset`) wrap database writes in try/except blocks with `db.session.rollback()` on failure, preventing partial writes.
- `db.session.flush()` is used in `create_asset` to obtain the asset's `id` before committing, allowing the log entry to reference it in the same transaction.

**Derived State**
- The current holder is always computed dynamically from the `assignments` table rather than stored as a denormalised field on the `asset` row. This prevents the asset status and holder from ever being out of sync.

**Serial Number Uniqueness**
- The `serial_number` column has a `UNIQUE` constraint at the database level (enforced by both SQLAlchemy and the migration schema), preventing duplicate assets regardless of how the database is accessed.

**Token Blocklist**
- Logged-out JWT tokens are immediately invalidated server-side via the in-memory blocklist, preventing session reuse after logout.

---

### 2.4 Usability

**Toast Notification System**
- A global `ToastProvider` (React Context) delivers success and error notifications after every user action. Toasts auto-dismiss after 3.5 seconds and animate in from the right.
- Error messages from the API (`data.error`) are surfaced directly in toasts rather than showing raw HTTP status codes.

**Loading States**
- Every async operation shows a visual loading indicator: a full-page spinner for initial data loads, inline `"…"` / `"Assigning…"` / `"Saving…"` text on buttons during submission, and a pulsing dot in the Quick Actions Widget.
- Buttons are disabled during submission to prevent double-clicks.

**Empty States**
- All tables and lists show a descriptive empty state (icon + message) when there is no data or no search results, rather than rendering an empty table.

**Contextual Page Subtitles**
- Every page has a subtitle in the topbar (defined in `pageMeta` in `App.js`) that describes the page's purpose, orienting the user to their current task.

**Inline Form Validation**
- `AddAssetPage` shows per-field error messages inline below each input, and clears them as the user corrects the field — no full-page reload required.
- Error borders (red) highlight the specific field that failed validation on the Login page.

**Confirmation Modal**
- Destructive actions (asset deletion) require explicit confirmation via a modal dialog that clearly states the consequences and is irreversible.

**Role-Aware UI**
- The sidebar and route guards adapt to the logged-in user's role, showing only the actions they are permitted to perform.

---

### 2.5 Maintainability

**Application Factory Pattern**
- `app.py` uses Flask's application factory pattern (`create_app()`), making the app testable and configurable without global state.

**Blueprint Architecture**
- Routes are split into two Flask Blueprints: `asset_bp` (asset and assignment routes) and `auth_bp` (authentication routes), keeping concerns separated.

**Service Layer**
- All business logic is isolated in `services/asset_service.py`, separate from route handlers. Routes handle HTTP concerns (request parsing, response formatting); services handle domain logic (validation, state transitions, logging).

**Decorator-Based Auth**
- `admin_required` and `login_required` are reusable decorators in `routes/decorators.py`, keeping auth logic out of individual route functions.

**CSS Design Token System**
- All colours, spacing, shadows, and border radii are defined as CSS custom properties in `:root` in `index.css`. Changing a token updates the entire UI consistently.

**Reusable React Components**
- `StatusBadge`, `StatCard`, `Toast`, `ConfirmModal`, `ProtectedRoute`, and `QuickActionsWidget` are self-contained, reusable components with no page-specific logic.

**Database Migrations**
- Schema changes are managed via Flask-Migrate (Alembic), with versioned migration scripts in `migrations/versions/`. The schema can be upgraded or rolled back with `flask db upgrade` / `flask db downgrade`.

**Centralised API Client**
- All HTTP calls from the React frontend go through `api/client.js`, which centralises auth header injection, error parsing, and base URL configuration. No fetch calls are scattered across page components.

---

### 2.6 Scalability

**Stateless JWT Authentication**
- JWT-based auth is stateless on the server (except for the in-memory blocklist). Multiple server instances can validate tokens without shared session storage.

**Database Migration Path**
- The SQLAlchemy ORM and Flask-Migrate are database-agnostic. Migrating from SQLite to PostgreSQL requires only a `SQLALCHEMY_DATABASE_URI` change in `config.py`.

**Configurable Token Expiry**
- Token lifetimes are set in `config.py` via named constants, making them easy to adjust without touching application logic.

**Activity Feed Pagination**
- The global activity feed is limited to 200 records server-side, preventing unbounded queries as the log grows.

**Separation of Frontend and Backend**
- The React frontend is a fully independent SPA that communicates with the Flask backend via a REST API. They can be deployed independently and scaled separately.

---

### 2.7 Accessibility

**Semantic HTML**
- Form inputs use `<label htmlFor="...">` associations with matching `id` attributes on all inputs in `LoginPage`.
- The login error message uses `role="alert"` so screen readers announce it immediately when it appears.
- The Quick Actions Widget uses `role="complementary"` on the root, `role="dialog"` on the panel, and `aria-modal="false"` to keep the rest of the page accessible.

**ARIA Attributes**
- The FAB uses `aria-expanded={open}` to communicate its toggle state to screen readers.
- Icon-only buttons have `aria-label` attributes: `"Toggle quick actions"`, `"Close widget"`, `"Show/Hide password"`.

**Keyboard Navigation**
- The `ConfirmModal` closes on `Escape` key press via a `keydown` event listener.
- All interactive elements are native `<button>` or `<input>` elements, keyboard-focusable by default.

**Visible Focus Indicators**
- All inputs and selects show a blue border (`border-color: var(--primary)`) on focus, making keyboard navigation visible.

**Colour + Text Redundancy**
- Status badges communicate state via both colour and text label (e.g., green + "Available"), not colour alone.
- The Fleet Health bar shows both a colour-coded bar and a numeric percentage.

---

### 2.8 Responsiveness

**Responsive Grid Layouts**
- The stats grid uses `grid-template-columns: repeat(4, 1fr)` on desktop, collapsing to `repeat(2, 1fr)` at 900px and `1fr 1fr` at 640px.
- The charts grid uses `1fr 1fr` on desktop, collapsing to `1fr` (stacked) at 900px.

**Mobile Sidebar Behaviour**
- At 640px and below, the sidebar is hidden (`display: none`) and the main content expands to full width (`margin-left: 0`).
- Page content padding reduces from `28px 32px` to `16px` on small screens.

**Overflow-Safe Tables**
- All tables are wrapped in `.table-wrap` with `overflow-x: auto`, allowing horizontal scrolling on narrow screens without breaking the layout.

**Flexible Form Layouts**
- The `AssignPage` and `AddAssetPage` use `flexWrap: "wrap"` with `flex: "1 1 400px"` on the form card, allowing the form and info panel to stack vertically on narrow screens.

---

## 3. API Reference

### Authentication Endpoints (`/auth`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/login` | No | Authenticate with email + password; returns access token, refresh token, user object |
| POST | `/auth/refresh` | Refresh token | Exchange refresh token for a new access token |
| POST | `/auth/logout` | Access token | Revoke the current access token (adds to blocklist) |
| GET | `/auth/me` | Access token | Return the currently authenticated user's profile |

### Asset Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/assets` | Any user | List all assets with current holder |
| POST | `/assets` | Admin only | Register a new asset |
| DELETE | `/assets/<id>` | Admin only | Permanently delete an asset (must not be assigned) |
| GET | `/users` | Any user | List all users (id + name) |
| POST | `/assign` | Any user | Assign an available asset to a user |
| POST | `/return/<id>` | Any user | Mark an assigned asset as returned |
| GET | `/asset/<id>/history/json` | Any user | Full lifecycle timeline for one asset (JSON) |
| GET | `/activity/json` | Any user | Global activity feed — last 200 events (JSON) |

---

## 4. Technology Stack

### Backend
| Component | Technology |
|-----------|------------|
| Language | Python 3.x |
| Web Framework | Flask |
| ORM | Flask-SQLAlchemy |
| Database Migrations | Flask-Migrate (Alembic) |
| Authentication | Flask-JWT-Extended |
| Password Hashing | Flask-Bcrypt |
| Database | SQLite (development) |

### Frontend
| Component | Technology |
|-----------|------------|
| Framework | React 18 |
| Routing | React Router DOM v6 |
| Charts | Recharts 2.x |
| HTTP Client | Fetch API (via `api/client.js`) |
| State Management | React Context (AuthContext, ToastContext) |
| Styling | Plain CSS with custom properties |
| Typeface | Inter |

---

## 5. Database Schema

### `users`
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | Primary Key |
| name | String(100) | NOT NULL |
| email | String(120) | NOT NULL, UNIQUE |
| password_hash | String(255) | Nullable (legacy rows) |
| role | String(20) | Default: `"employee"` |

### `assets`
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | Primary Key |
| name | String(50) | NOT NULL |
| serial_number | String(50) | NOT NULL, UNIQUE |
| status | String(50) | NOT NULL, Default: `"available"` |

### `assignments`
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | Primary Key |
| asset_id | Integer | FK → assets.id, NOT NULL, Indexed |
| assigned_to_user_id | Integer | FK → users.id, NOT NULL, Indexed |
| assigned_by_user_id | Integer | FK → users.id, NOT NULL, Indexed |
| assigned_at | DateTime (tz) | Default: UTC now |
| returned_at | DateTime | Nullable (NULL = still assigned) |
| notes | String(255) | Nullable |

Composite index: `idx_asset_active` on `(asset_id, returned_at)`.

### `asset_logs`
| Column | Type | Constraints |
|--------|------|-------------|
| id | Integer | Primary Key |
| event | String(20) | NOT NULL (`created` / `assigned` / `returned` / `deleted`) |
| asset_id | Integer | Nullable (NULL after asset deletion) |
| asset_name | String(50) | NOT NULL (snapshot) |
| serial_number | String(50) | NOT NULL (snapshot) |
| actor | String(100) | Nullable |
| detail | String(255) | Nullable |
| timestamp | DateTime (tz) | NOT NULL, Default: UTC now |

### Entity Relationships
```
users (1) ──────────────────── (N) assignments  [assigned_to_user_id]
users (1) ──────────────────── (N) assignments  [assigned_by_user_id]
assets (1) ─────────────────── (N) assignments  [asset_id]
assets (1) ─────────────────── (N) asset_logs   [asset_id]  (nullable after deletion)
```
