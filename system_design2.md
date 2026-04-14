# HCI Design Principles — Shared Asset Custody System (React Frontend)

---

## 1. User-Centered Design (UCD)

**Where it is implemented:**
- `QuickActionsWidget.js` — The widget is explicitly documented with the comment *"surfaces the 3 most frequent user tasks (assign, add, history)"*, meaning the UI was shaped around what users actually do most.
- `Sidebar.js` — Navigation links are filtered by role (`adminOnly`). Employees never see the "Add Asset" link, so the interface only shows what is relevant to each user type.
- `App.js` — `pageMeta` provides a contextual subtitle on every page (e.g., *"Assign an available asset to a team member"*), orienting the user to their current task.
- `AssignPage.js` — The form pre-filters the asset dropdown to show only `available` assets, removing irrelevant choices and reducing cognitive load.
- `ProtectedRoute.js` — Unauthenticated users are redirected to `/login` with the original destination saved (`state.from`), so they land back where they intended after signing in.

**Features that show this principle:**
- Role-based navigation (admin vs. employee views)
- Context-aware page subtitles in the topbar
- Pre-filtered dropdowns showing only actionable data
- Post-login redirect to the originally requested page

---

## 2. Consistency

**Where it is implemented:**
- `index.css` — A single CSS design token system (`--primary`, `--danger`, `--success`, `--border`, `--radius`, `--shadow`, etc.) is defined in `:root` and reused across every component, ensuring visual uniformity.
- `index.css` (`.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.btn-sm`) — A unified button system with consistent padding, border-radius, font-size, and hover transitions is applied everywhere.
- `StatusBadge.js` — A single reusable component renders all asset status labels with the same pill shape and color scheme across Dashboard, Inventory, and History pages.
- `QuickActionsWidget.js` — The comment *"Consistency: reuse .btn, .badge, and CSS variable tokens from the design system"* confirms intentional reuse.
- `HistoryPage.js` (`EVENT_META`) — All event types (created, assigned, returned, deleted) use the same `EventBadge` component with a consistent icon + color + label pattern.
- `index.css` (`.card`, `.card-header`) — Every page section uses the same card container with identical padding, border, and shadow.

**Features that show this principle:**
- Unified color token system across all pages
- Same button styles on Login, Dashboard, AssignPage, AddAssetPage, InventoryPage
- StatusBadge used identically on Dashboard and InventoryPage
- Consistent table structure (`th`, `td` styles) across all data tables

---

## 3. Feedback

**Where it is implemented:**
- `Toast.js` — A global toast notification system provides immediate success/error feedback after every user action (assign, return, delete, add). Toasts auto-dismiss after 3.5 seconds.
- `Dashboard.js` — The Return button shows `"…"` while the API call is in progress (`returning === asset.id`), giving inline loading feedback.
- `AssignPage.js` — The Submit button changes to `"Assigning…"` while submitting, and is disabled to prevent double-submission.
- `AddAssetPage.js` — The Submit button changes to `"Saving…"` during the API call.
- `LoginPage.js` — A spinner (`login-spinner`) replaces the "Sign In" label during authentication, and an error box with `role="alert"` appears on failure.
- `QuickActionsWidget.js` — A live "Fleet Health" progress bar with a pulsing loading dot shows real-time asset availability percentage when the widget is opened.
- `index.css` (`.badge-dot`) — A green dot in the topbar signals that the app is connected to the Flask API.
- `index.css` (`@keyframes slideIn`) — Toast notifications animate in from the right, drawing attention to the feedback message.
- `ProtectedRoute.js` — A full-screen spinner is shown while the auth state is being resolved, preventing a blank or broken UI flash.

**Features that show this principle:**
- Toast notifications for every create/assign/return/delete action
- Button loading states ("Assigning…", "Saving…", "…")
- Login spinner and inline error alert
- Fleet Health bar with live percentage in QuickActionsWidget
- API connection indicator dot in the topbar

---

## 4. Simplicity

**Where it is implemented:**
- `QuickActionsWidget.js` — Collapsed by default; the panel is hidden until the user clicks the FAB. The comment reads *"Simplicity: collapsed by default; one click reveals only what's needed"*.
- `App.js` — The Login page renders without the sidebar/topbar shell, keeping the authentication screen clean and focused.
- `StatCard.js` — A minimal component that shows only an icon, a number, and a label — no unnecessary decoration.
- `index.css` (`.empty-state`) — Empty states show a single icon and one line of text instead of complex UI, reducing noise when there is no data.
- `AssignPage.js` — The form has only 4 fields (asset, recipient, assigner, notes), covering the minimum required for an assignment.
- `AddAssetPage.js` — The form has only 3 fields (name, serial number, status), keeping asset registration fast.
- `index.css` — The layout uses a fixed sidebar + scrollable main area, a well-understood pattern that requires no learning.

**Features that show this principle:**
- QuickActionsWidget collapsed by default
- Minimal form fields on AssignPage and AddAssetPage
- Clean empty states with a single icon and message
- Login page rendered without the app shell

---

## 5. Hierarchy (Visual Hierarchy)

**Where it is implemented:**
- `Dashboard.js` — The page is structured top-to-bottom: stat cards (most critical summary) → bar chart (distribution) → full asset table (detail). Most important information is always at the top.
- `index.css` (`.topbar-title`, `.topbar-sub`) — The page title uses `1.1rem / font-weight: 600` while the subtitle uses `0.8rem / color: var(--text-muted)`, creating a clear typographic hierarchy.
- `index.css` (`.stat-value`, `.stat-label`) — The numeric value is `1.6rem / font-weight: 700` and the label is `0.78rem / color: var(--text-muted)`, making the number the focal point.
- `QuickActionsWidget.js` — The panel is ordered: header → health bar (most critical signal) → action buttons → footer (least critical). The comment reads *"Hierarchy: health bar at top (most critical), actions below, footer last"*.
- `index.css` (`.qaw-footer`) — The footer uses `0.72rem` and `var(--text-muted)`, visually subordinate to the action buttons above it.
- `index.css` (`th`) — Table headers use `0.75rem / uppercase / letter-spacing` to distinguish them from `td` data rows (`0.875rem`).
- `HistoryPage.js` — The asset name and serial number are shown prominently at the top of the timeline, with event metadata (`0.78rem / text-muted`) below each entry.

**Features that show this principle:**
- Dashboard layout: stats → chart → table
- QuickActionsWidget panel order: health → actions → footer
- Typographic scale: large bold values, small muted labels
- Table header vs. data row visual distinction

---

## 6. Accessibility

**Where it is implemented:**
- `LoginPage.js` — All inputs have explicit `<label htmlFor="...">` associations (`id="email"`, `id="password"`), making them screen-reader accessible. The error div uses `role="alert"` for assistive technology announcements.
- `LoginPage.js` — The password toggle button has `aria-label={showPass ? "Hide password" : "Show password"}`, providing a meaningful label for screen readers.
- `QuickActionsWidget.js` — The FAB uses `aria-expanded={open}` and `aria-label="Toggle quick actions"`. The panel uses `role="dialog"` and `aria-modal="false"`. The close button has `aria-label="Close widget"`. The root div uses `role="complementary"` and `aria-label="Quick Actions"`.
- `ConfirmModal.js` — The modal closes on `Escape` key press (`window.addEventListener("keydown", handler)`), supporting keyboard-only navigation.
- `index.css` — Focus states are styled (`.search-input:focus`, `.form-group input:focus` → `border-color: var(--primary)`), making keyboard focus visible.
- `index.css` — Color choices use sufficient contrast: white text on `--sidebar-bg: #0f172a`, white text on `--primary: #3b82f6`, and dark text (`--text: #1e293b`) on light backgrounds.
- `index.css` (`@media (max-width: 640px)`) — Responsive breakpoints ensure the layout is usable on smaller screens (sidebar hides, padding reduces, grid collapses).

**Features that show this principle:**
- `role="alert"` on login error, `aria-label` on icon-only buttons
- `aria-expanded` and `role="dialog"` on QuickActionsWidget
- Escape key closes ConfirmModal
- Visible focus ring on all interactive inputs
- Responsive layout for mobile screens

---

## 7. Aesthetic (Aesthetic and Minimalist Design)

**Where it is implemented:**
- `index.css` — The design uses a restrained palette: one primary blue (`#3b82f6`), semantic colors for status (green/yellow/red), a near-white background (`#f4f6fb`), and a dark sidebar (`#0f172a`). No decorative gradients or unnecessary imagery.
- `index.css` (`.card`) — Cards use a subtle `box-shadow` (`0 1px 3px / 0 4px 16px`) and `border-radius: 12px` for a clean, modern look without heavy borders.
- `index.css` (`.badge`) — Status badges use soft tinted backgrounds (e.g., `#f0fdf4` for available) with matching text colors, avoiding harsh solid fills.
- `index.css` (`.sidebar`) — The sidebar uses a dark background with low-opacity white dividers (`rgba(255,255,255,0.08)`), creating depth without clutter.
- `LoginPage.js` — The login card is centered on a plain background with generous padding (`40px 36px`) and a single brand icon, keeping the entry point clean and professional.
- `index.css` (`font-family: "Inter"`) — Inter is a modern, highly legible typeface chosen for its clean aesthetic in UI contexts.
- `index.css` (`.qaw-panel`) — The Quick Actions panel uses `box-shadow: 0 8px 32px rgba(0,0,0,0.14)` and a slide-up animation, adding polish without distraction.

**Features that show this principle:**
- Consistent soft color palette with semantic meaning
- Subtle shadows and rounded corners on all cards
- Tinted badge backgrounds instead of solid fills
- Clean login page with minimal elements
- Inter typeface for professional readability

---

## 8. Affordance

**Where it is implemented:**
- `index.css` (`.qaw-fab`) — The FAB has `box-shadow: 0 4px 16px rgba(59,130,246,0.45)` and `transform: scale(1.08)` on hover, making it look physically pressable. The CSS comment reads *"FAB — Affordance: raised shadow + scale on hover"*.
- `index.css` (`.btn-primary:hover`) — Primary buttons darken on hover (`--primary-dark`), signaling they are clickable.
- `index.css` (`.btn-ghost:hover`) — Ghost buttons gain a background fill on hover, confirming interactivity.
- `index.css` (`.nav-link:hover`) — Sidebar links gain a white background tint on hover, indicating they are clickable navigation items.
- `index.css` (`.search-input:focus`, `.form-group input:focus`) — Inputs highlight their border in primary blue on focus, signaling that they are active and accepting input.
- `InventoryPage.js` — Assigned assets show `"🔒 Return first"` with `cursor: not-allowed` instead of a delete button, clearly communicating that the action is unavailable and why.
- `index.css` (`.filter-select`) — The dropdown uses `cursor: pointer`, reinforcing that it is an interactive control.
- `QuickActionsWidget.js` — The FAB icon changes from `"⚡"` to `"✕"` when open, signaling the toggle state and what clicking it will do.

**Features that show this principle:**
- FAB raised shadow + scale-on-hover effect
- Button hover color changes across all button variants
- Input border highlight on focus
- Disabled state with `cursor: not-allowed` and explanatory label on locked delete buttons
- FAB icon toggle (⚡ ↔ ✕) to signal state

---

## 9. Flexibility

**Where it is implemented:**
- `Dashboard.js` — Users can filter assets by status (All / Available / Assigned / Maintenance / Retired) AND search by name, serial number, or holder simultaneously, supporting both browsing and targeted lookup workflows.
- `HistoryPage.js` — The page serves two modes from one route: `/history` shows a global activity feed; `/history/:assetId` shows a specific asset's timeline. Users can navigate either way.
- `HistoryPage.js` (`GlobalActivity`) — The activity feed has an event-type filter dropdown (All / Added / Assigned / Returned / Deleted), letting power users narrow the log.
- `QuickActionsWidget.js` — The widget is available on every page (rendered in `App.js` outside the route tree), so users can jump to any key action from anywhere without navigating to a specific page first.
- `Sidebar.js` — Role-based link filtering means the same sidebar component adapts its options for admin and employee users without separate components.
- `index.css` (`@media`) — Responsive breakpoints at 900px and 640px allow the layout to adapt from a 4-column grid to 2-column to single-column, supporting different screen sizes.
- `AssignPage.js` — The optional `notes` textarea lets users add context to an assignment without making it mandatory, accommodating both quick and detailed workflows.

**Features that show this principle:**
- Combined search + filter on Dashboard
- Dual-mode HistoryPage (global feed vs. per-asset timeline)
- QuickActionsWidget accessible from every page
- Optional notes field on AssignPage
- Responsive grid layout for different screen sizes

---

## 10. Error Prevention and Recovery

**Where it is implemented:**
- `AddAssetPage.js` — Client-side validation runs before any API call: empty name, empty serial number, and invalid serial number characters are caught with inline `FieldError` messages. Errors clear as the user types (`handleChange` removes the error for the changed field).
- `AssignPage.js` — The form checks that all three required fields are filled before submitting, showing a toast error if not. The asset dropdown only lists `available` assets, preventing assignment of unavailable ones.
- `InventoryPage.js` + `ConfirmModal.js` — Deleting an asset requires a two-step confirmation modal with an explicit warning: *"⚠ This action cannot be undone. All assignment history for this asset will also be permanently deleted."* The modal closes on Escape or backdrop click, making it easy to cancel.
- `InventoryPage.js` — Assigned assets cannot be deleted; the delete button is replaced with `"🔒 Return first"`, preventing data integrity errors at the UI level.
- `LoginPage.js` — The error box uses `role="alert"` and highlights both input borders in red (`borderColor: var(--danger)`) when login fails, making the problem immediately visible. Errors clear on any input change.
- `Dashboard.js` — API failures show a toast error (`"Failed to load assets"`), and the empty state (`📭 No assets match your search or filter.`) prevents confusion when filters return no results.
- `client.js` — The `request` function extracts `data.error` from API responses and throws it as a readable message, ensuring all API errors surface as human-readable toast notifications rather than raw HTTP codes.
- `ConfirmModal.js` — The modal includes a yellow warning box (`⚠ This action cannot be undone`) before the confirm button, giving users a final chance to reconsider.

**Features that show this principle:**
- Inline field validation with per-field error messages on AddAssetPage
- Two-step delete confirmation modal with irreversibility warning
- Locked delete button for assigned assets ("🔒 Return first")
- Login error highlights both fields and clears on correction
- Pre-filtered asset dropdown prevents assigning unavailable assets
- Human-readable API error messages via `client.js`

---

## Summary Table

| HCI Principle            | Key Files / Components                                      | Representative Feature                                      |
|--------------------------|-------------------------------------------------------------|-------------------------------------------------------------|
| User-Centered Design     | `QuickActionsWidget`, `Sidebar`, `AssignPage`, `ProtectedRoute` | Role-filtered nav; pre-filtered dropdowns; post-login redirect |
| Consistency              | `index.css`, `StatusBadge`, `HistoryPage`                   | Unified token system; reusable badge and button components  |
| Feedback                 | `Toast`, `Dashboard`, `AssignPage`, `LoginPage`, `QuickActionsWidget` | Toast notifications; button loading states; Fleet Health bar |
| Simplicity               | `QuickActionsWidget`, `StatCard`, `AddAssetPage`            | Collapsed FAB panel; minimal form fields; clean empty states |
| Hierarchy                | `Dashboard`, `index.css`, `QuickActionsWidget`              | Stats → chart → table layout; typographic scale             |
| Accessibility            | `LoginPage`, `QuickActionsWidget`, `ConfirmModal`, `index.css` | `role="alert"`, `aria-label`, Escape key, visible focus ring |
| Aesthetic                | `index.css`, `LoginPage`                                    | Restrained palette; soft shadows; Inter typeface            |
| Affordance               | `index.css`, `QuickActionsWidget`, `InventoryPage`          | FAB hover scale; button hover states; locked delete cursor  |
| Flexibility              | `Dashboard`, `HistoryPage`, `QuickActionsWidget`, `index.css` | Search + filter; dual-mode history; responsive breakpoints  |
| Error Prevention & Recovery | `AddAssetPage`, `ConfirmModal`, `InventoryPage`, `LoginPage`, `client.js` | Inline validation; two-step delete; locked assigned-asset delete |
