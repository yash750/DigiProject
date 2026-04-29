# HCI Design Principles — Shared Asset Custody System

> This document maps all 10 HCI Design Principles to the actual features and interactions implemented in the application.

---

## 1. User-Centered Design (UCD)

> Design should be driven by the needs, goals, and behaviours of the actual users.

The entire application is structured around two distinct user types — **Admin** and **Employee** — and every screen adapts to serve their specific needs.

**Where it is used:**

- The navigation sidebar automatically shows or hides menu items based on the logged-in user's role. An employee never sees options they are not permitted to use, such as Add Asset or Employees management.
- The Assign / Transfer page shows a completely different interface depending on who is logged in. An admin sees a form to assign any available asset to any team member. An employee sees only the assets currently held by them, with a transfer form to pass them to a colleague.
- The Requests page adapts its tabs based on role. Employees see a form to raise new requests and track their own. Admins see a pending inbox to approve or reject requests.
- When an employee submits a specific asset request, the admin sees it immediately in their inbox — the workflow is designed around how approvals actually happen in a team.
- The asset dropdown on the Assign form only shows assets that are currently available, removing irrelevant choices and reducing the decision load on the user.
- After logging in, users are automatically redirected to the page they originally tried to access, respecting their intent.
- The Quick Actions Widget surfaces the three most frequently performed tasks — Assign Asset, Add New Asset, and View History — directly accessible from any page without navigating away.

---

## 2. Consistency

> Maintaining uniformity in design elements like fonts, buttons, and layouts across the interface.

Every visual and interactive element across the application follows a single shared design language. A user who learns one part of the interface can immediately use any other part.

**Where it is used:**

- All buttons across every page use the same shape, size, font weight, and hover behaviour. Primary actions are always blue, destructive actions are always red, and secondary actions are always outlined grey — regardless of which page they appear on.
- Status badges (Available, Assigned, Maintenance, Retired) use the same pill shape, colour coding, and dot indicator everywhere — on the Dashboard, Inventory page, History timeline, and Assign page.
- Every data table across the application uses the same column header style, row padding, hover highlight, and border treatment.
- All form fields — whether on the Login page, Add Asset page, Employee page, or Profile page — use the same input height, border style, focus highlight colour, and label typography.
- Every card container (stat cards, form cards, data cards) uses the same background colour, border radius, and shadow depth.
- Toast notifications for success and error always appear in the same position (bottom-right), with the same animation, and the same colour coding (dark green for success, dark red for error).
- The page title and subtitle in the top bar follow the same typographic hierarchy on every page.
- The Quick Actions Widget reuses the same button classes and badge styles as the rest of the application — it does not introduce any new visual language.

---

## 3. Feedback

> Providing clear responses to user actions within the interface.

The application never leaves the user wondering whether their action was registered. Every interaction produces an immediate, visible response.

**Where it is used:**

- Every successful action — assigning an asset, returning an asset, adding an employee, submitting a request, updating a profile — triggers a toast notification confirming what happened.
- Every failed action — wrong password, duplicate serial number, unavailable asset — triggers a toast notification with a specific, human-readable error message.
- Submit buttons change their label while an operation is in progress: "Assign Asset" becomes "Assigning…", "Save Changes" becomes "Saving…", "Add Employee" becomes "Adding…". The button is also disabled during this time to prevent double submission.
- While data is loading, a spinning loader is shown in place of the table or content, so the user knows the system is working.
- The Fleet Health bar inside the Quick Actions Widget fills with a smooth animation when opened, and changes colour dynamically — green when most assets are free, amber when partially utilised, red when heavily utilised — giving an instant visual signal about fleet status.
- A green dot in the top bar indicates that the application is connected to the backend API.
- The active navigation link in the sidebar is highlighted in blue, always showing the user exactly where they are in the application.
- When a password change form has errors, each field individually highlights in red with a specific message explaining what is wrong.
- Submit buttons show `aria-busy` state during processing, communicating loading status to assistive technologies.

---

## 4. Simplicity

> Minimise unnecessary elements, focus on essential functions.

The interface presents only what is needed for the current task. Complexity is hidden until the user explicitly requests it.

**Where it is used:**

- The Quick Actions Widget is a small circular button by default. The full panel — with health data, action buttons, and statistics — only appears when the user clicks it. Users who do not need it are not distracted by it.
- The Login page is rendered without the sidebar or top bar, keeping the entry point clean and focused on a single task.
- Stat cards on the Dashboard show only three pieces of information: an icon, a number, and a label. No unnecessary decoration.
- When no assets match a search or filter, a simple empty state with a single icon and one line of text is shown instead of an empty table.
- The Add Asset form has only three fields — name, serial number, and status. The minimum required to register an asset.
- The Assign form has only four fields — asset, recipient, assigner, and optional notes. Nothing more than what is needed to complete an assignment.
- Employee-facing pages hide all admin controls entirely, so employees are never presented with actions they cannot perform.

---

## 5. Hierarchy (Visual Hierarchy)

> Organisation of content and elements in a way that directs user attention to the most important information first.

Every page is structured so the most critical information is the most visually prominent, guiding the user's eye from high-level summary down to detail.

**Where it is used:**

- The Dashboard is structured top-to-bottom in order of importance: four summary stat cards at the top (most critical — instant fleet overview), then a distribution chart (supporting context), then the full asset table (detailed data).
- Stat card values are displayed in large bold numbers (`1.6rem, font-weight 700`) while their labels are small and muted (`0.78rem`), making the number the immediate focal point.
- The page title in the top bar uses a larger, heavier font than the subtitle below it, establishing a clear reading order.
- The Quick Actions Widget panel is ordered: Fleet Health bar at the top (most critical signal — tells the user if action is even possible), then action buttons (primary purpose), then a footer with total asset count (least critical metadata).
- On the Profile page, the Edit Profile section appears above the Change Password section, reflecting the relative frequency of use.
- Table headers use uppercase, small font, and muted colour to visually subordinate them to the data rows they label.
- The sidebar logo and organisation name appear at the top, navigation links in the middle, and the user identity block at the bottom — matching the natural reading order of importance.
- Page headers use an icon, a bold title, and a smaller muted subtitle — three levels of visual weight that guide the eye from general to specific.

---

## 6. Accessibility

> Designs are usable by differently-abled people.

The application is built to be usable by people who rely on screen readers, keyboard navigation, or other assistive technologies.

**Where it is used:**

- A **skip-to-content** link is the first focusable element on every page. It is visually hidden until focused via keyboard, allowing keyboard users to bypass the sidebar navigation and jump directly to the main content.
- The main content area is marked with `role="main"`, helping screen readers identify the primary content region.
- All form labels are explicitly associated with their input fields using matching `for` and `id` attributes, so screen readers announce the correct label when a field is focused.
- Error messages below form fields are linked to their input via `aria-describedby`, so screen readers read the error when the field is focused.
- Error messages use `role="alert"` so they are announced immediately by screen readers when they appear, without the user needing to navigate to them.
- The logout button, avatar, and other icon-only interactive elements have `aria-label` attributes providing a text description for screen readers.
- The Quick Actions Widget FAB uses `aria-expanded` to communicate its open/closed state, `aria-label` for its purpose, and `role="dialog"` on the panel.
- The Confirm Delete modal closes on pressing the Escape key, supporting keyboard-only users.
- All interactive elements are native `<button>` or `<input>` elements, making them keyboard-focusable by default.
- Input fields and selects show a visible blue border highlight on keyboard focus, making the current focus position clear.
- Status badges communicate state through both colour and text label — never colour alone — ensuring the information is accessible to colour-blind users.
- The Fleet Health bar shows both a colour-coded bar and a numeric percentage, not relying on colour alone to convey meaning.
- Loading spinners use `role="status"` and `aria-label` so screen readers announce that content is loading.
- Submit buttons use `aria-busy` during processing to communicate loading state to assistive technologies.

---

## 7. Aesthetic Integrity

> The balance between visual beauty and the practical functionality of the interface.

The application looks professional and polished without sacrificing usability. Every visual decision serves a functional purpose.

**Where it is used:**

- The colour palette is deliberately restrained: one primary blue for actions, semantic colours for status (green = available, yellow = assigned, red = danger), a near-white background, and a dark sidebar. No decorative gradients or unnecessary imagery.
- Status badges use soft tinted backgrounds (light green, light blue, light yellow, light red) with matching text colours, making status instantly readable without harsh solid fills.
- Cards use a subtle multi-layer shadow and `12px` border radius, giving depth and separation without heavy borders.
- The sidebar uses a deep navy background with low-opacity white dividers, creating visual depth while keeping the navigation clean.
- The Inter typeface is used throughout — a modern, highly legible typeface designed specifically for screen interfaces.
- Page headers use a coloured icon block alongside the title and subtitle, creating a visual anchor for each page that is both decorative and functional.
- The Quick Actions Widget panel slides up with a smooth animation when opened, and the health bar fills with a transition — adding polish without distracting from the task.
- The Login page is centred on a plain background with generous padding and a single brand icon, creating a calm, professional first impression.
- The light and dark themes both maintain the same visual hierarchy and contrast ratios, ensuring aesthetic integrity is preserved regardless of the user's theme choice.

---

## 8. Affordance

> Intuitive design elements visually indicating how they should be used.

Every interactive element in the application communicates its purpose through its visual appearance, so users know what to do without being told.

**Where it is used:**

- The Quick Actions Widget button is a raised circular button with a coloured drop shadow and scales up slightly when hovered, communicating that it is pressable — a standard affordance for floating action buttons.
- The FAB icon changes from ⚡ to ✕ when the panel is open, signalling that clicking it again will close the panel.
- All buttons darken or change background on hover, confirming they are clickable.
- Input fields highlight their border in blue when focused, signalling that they are active and accepting input.
- Assigned assets in the Inventory table show a locked label "🔒 Return first" with a `not-allowed` cursor instead of a delete button, clearly communicating that the action is unavailable and explaining why.
- Action buttons use verb-first labels — "Assign Asset", "Transfer", "Add Employee", "Delete" — so the outcome of clicking is unambiguous.
- The password visibility toggle button uses eye icons (👁 / 🙈) that universally communicate show/hide password.
- The sidebar navigation links show a blue background on the active link, indicating the current location.
- Ghost buttons (outlined, no fill) visually signal secondary actions, while filled blue buttons signal primary actions — establishing a clear action hierarchy through appearance alone.
- Dropdown selects use `cursor: pointer` to reinforce that they are interactive controls.

---

## 9. Flexibility

> Users should be able to customise the interface.

The application adapts to different users, preferences, screen sizes, and workflows — giving users control over how they interact with it.

**Where it is used:**

- Users can switch between **Light** and **Dark** themes using the theme picker in the top bar. The chosen theme is saved to the browser and restored automatically on the next visit.
- The Dashboard search and filter state is saved to the browser. If a user searches for "Dell Laptop" and filters by "Assigned", that view is preserved when they navigate away and return — they do not have to re-enter their search.
- The Dashboard supports simultaneous search and status filtering, allowing users to combine both to find exactly what they need.
- The History page works in two modes from the same navigation link: a global activity feed showing all events across all assets, or a per-asset timeline when accessed from a specific asset row — serving both browsing and targeted lookup workflows.
- The Global Requests board on the Requests page allows employees to fulfil requests using any asset they currently hold, giving them flexibility in how they respond.
- The notes field on assignment and transfer forms is optional, accommodating both quick workflows (no notes) and detailed ones (with context).
- The application layout is fully responsive: the sidebar hides on small screens, grids collapse from 4 columns to 2 to 1, and tables scroll horizontally — making the application usable on any screen size.
- The Quick Actions Widget is available on every page, giving users a persistent shortcut to common actions regardless of where they are in the application.

---

## 10. Error Prevention and Recovery

> Prevention — minimise users' mistakes. Recovery — helping users fix errors.

The application is designed to stop errors before they happen, and when they do occur, to help the user understand and fix them quickly.

**Where it is used:**

- The asset dropdown on the Assign form only shows assets with "Available" status. It is impossible to accidentally attempt to assign an unavailable asset.
- Deleting an asset requires a two-step confirmation modal that explicitly states: "This action cannot be undone. All assignment history will also be permanently deleted." The user must actively confirm before anything is deleted.
- Assigned assets cannot be deleted at all. The delete button is replaced with a locked label explaining that the asset must be returned first, preventing accidental data loss.
- The Add Asset form validates the asset name, serial number presence, and serial number character format before making any API call. Errors appear inline below the specific field that failed, not as a generic page-level message.
- Error messages clear automatically as the user corrects the field, providing real-time recovery guidance.
- The password change form requires the user to enter their current password before setting a new one, preventing accidental or unauthorised password changes.
- A confirm password field requires the user to type the new password twice, catching typos before they lock the user out.
- The login form highlights both input fields in red and shows a specific error message when credentials are wrong, making it clear what needs to be corrected.
- Employees cannot fulfil their own global asset request — the system blocks this at both the UI and API level.
- An employee cannot transfer an asset they do not currently hold — the system verifies ownership before allowing the transfer.
- All API errors are caught and surfaced as human-readable toast messages rather than raw HTTP status codes, so users always understand what went wrong.
- The Confirm Delete modal can be dismissed by pressing Escape or clicking outside it, making it easy to cancel a destructive action at the last moment.
- Duplicate pending requests for the same asset by the same user are blocked, preventing accidental double-submissions.

---

## Summary Table

| # | Principle | Key Features |
|---|---|---|
| 1 | User-Centered Design | Role-adaptive navigation, role-split Assign/Transfer page, adaptive Requests tabs, pre-filtered dropdowns |
| 2 | Consistency | Unified button system, identical status badges everywhere, same form field style, same card and table treatment |
| 3 | Feedback | Toast notifications, button loading states, Fleet Health bar, active nav highlight, field-level error messages |
| 4 | Simplicity | Collapsed Quick Actions Widget, minimal form fields, clean empty states, login page without shell |
| 5 | Hierarchy | Dashboard stats → chart → table, large bold values with small muted labels, page header icon → title → subtitle |
| 6 | Accessibility | Skip-to-content link, role=main, label/id pairing, aria-describedby, role=alert, aria-expanded, Escape key on modal |
| 7 | Aesthetic Integrity | Restrained palette, tinted badges, subtle shadows, Inter typeface, page header component, theme-consistent contrast |
| 8 | Affordance | FAB raised shadow + scale, button hover states, focus border highlight, locked delete cursor, verb-first button labels |
| 9 | Flexibility | Light/Dark theme with persistence, Dashboard search+filter persistence, responsive layout, optional notes fields |
| 10 | Error Prevention & Recovery | Pre-filtered dropdowns, two-step delete modal, locked delete for assigned assets, inline field validation, confirm password field |
