# Quick Actions Widget — Design & Functionality Document

**Project:** AssetTracker — Shared Asset Management System  
**Component:** QuickActionsWidget  
**File:** `react_app/src/components/QuickActionsWidget.js`  
**Type:** Floating UI Widget (React Component)  
**Author:** [Your Name]  
**Date:** [Submission Date]  
**Course / Assignment:** [Course Name / Assignment Number]

---

## Table of Contents

1. [Overview](#1-overview)
2. [Purpose and Motivation](#2-purpose-and-motivation)
3. [Design Principles Applied](#3-design-principles-applied)
4. [Widget Structure and Layout](#4-widget-structure-and-layout)
5. [Functionality Breakdown](#5-functionality-breakdown)
6. [State Management](#6-state-management)
7. [Visual Design and Styling](#7-visual-design-and-styling)
8. [Accessibility](#8-accessibility)
9. [Integration with the Application](#9-integration-with-the-application)
10. [Screenshots](#10-screenshots)
11. [Code Walkthrough](#11-code-walkthrough)
12. [Design Decisions and Trade-offs](#12-design-decisions-and-trade-offs)

---

## 1. Overview

The **Quick Actions Widget** is a floating, persistent UI component added to the AssetTracker application. It appears as a circular Floating Action Button (FAB) fixed to the bottom-right corner of every page in the application. When clicked, it expands into a compact panel that gives users instant access to the most common tasks and a live summary of the asset fleet's health — all without navigating away from the current page.

The widget is a **one-page app component**, meaning it is mounted once at the application shell level (`App.js`) and remains visible and functional across all routes: Dashboard, Inventory, Assign, History, and Add Asset.

---

## 2. Purpose and Motivation

### Problem it Solves

In the AssetTracker application, users frequently need to perform the same three or four actions repeatedly throughout their workflow:

- Assign an asset to a team member
- Add a new asset to the inventory
- Check the assignment history
- View the inventory

Without the widget, each of these actions requires the user to navigate to a specific page using the sidebar. This creates unnecessary friction, especially when a user is mid-task on one page and needs to quickly jump to another action.

### Solution

The Quick Actions Widget provides a **persistent shortcut panel** that:

- Is always one click away, regardless of which page the user is on
- Shows a live fleet health summary so users can assess asset availability at a glance before taking action
- Closes automatically after navigating, keeping the interface clean

---

## 3. Design Principles Applied

The widget was designed with seven core UX/UI design principles. Each principle is explicitly mapped to a specific implementation decision.

---

### 3.1 User-Centred Design (UCD)

> Design should be driven by the needs, goals, and behaviours of the actual users.

**Application:**  
The widget surfaces the three most frequently performed tasks in the application — Assign Asset, Add New Asset, and View History — directly in the widget panel. These were identified as the highest-frequency actions based on the application's core workflow. Rather than designing the widget around what is technically easy to implement, it was designed around what users actually do most often.

The Fleet Health bar also directly addresses a user need: before assigning an asset, a user naturally wants to know how many assets are currently available. The widget answers this question immediately without requiring navigation to the Dashboard or Inventory page.

---

### 3.2 Consistency

> UI elements should behave and look the same way throughout the application.

**Application:**  
The widget reuses the application's existing design system tokens and CSS classes entirely:

- All buttons inside the widget use the existing `.btn`, `.btn-primary`, and `.btn-ghost` classes — the same classes used on every other page
- Status badges (Available, Assigned, Maintenance) use the existing `.badge`, `.badge.available`, `.badge.assigned`, and `.badge.maintenance` classes
- Colours, border-radius, font sizes, and shadows all reference the same CSS custom properties (`--primary`, `--border`, `--radius`, `--shadow`, `--card`) defined in `index.css`

A user who has used the rest of the application will immediately recognise the visual language of the widget without any learning curve.

---

### 3.3 Feedback

> The system should always keep users informed about what is happening.

**Application:**  
The widget provides feedback at multiple levels:

- **Loading state:** When the widget is opened, it immediately fetches live asset data from the API. While the data is loading, a pulsing animated dot (`.qaw-loading-dot`) appears next to the "Fleet Health" label, signalling that data is being retrieved.
- **Health bar animation:** Once data loads, the health bar fills from 0% to the actual percentage with a smooth CSS transition (`transition: width 0.5s ease`), giving a clear visual signal that the data has arrived.
- **Colour-coded health:** The health percentage and bar colour change dynamically — green (≥60%), amber (≥30%), red (<30%) — giving immediate feedback on the state of the fleet.
- **FAB state change:** The FAB button changes from a ⚡ icon to a ✕ icon and shifts from blue to slate when the panel is open, confirming the toggle state to the user.
- **Navigation feedback:** After clicking an action button, the panel closes and the user is navigated to the target page, confirming the action was registered.

---

### 3.4 Simplicity

> Interfaces should present only what is necessary, removing anything that adds complexity without adding value.

**Application:**  
The widget is **collapsed by default**. On first load, the user sees only a small 52×52px circular button. The full panel — with health data, action buttons, and footer — is hidden until the user explicitly requests it by clicking the FAB.

This means the widget adds zero visual noise to any page in its default state. Users who do not need it are not distracted by it. Users who do need it can access it with a single click.

The panel itself is also deliberately minimal: a header, a health section, four action buttons, and a one-line footer. There are no settings, no dropdowns, no nested menus.

---

### 3.5 Affordance

> Design elements should visually communicate how they are meant to be used.

**Application:**  
- The **FAB** uses a raised drop shadow (`box-shadow: 0 4px 16px rgba(59,130,246,0.45)`) and scales up slightly on hover (`transform: scale(1.08)`), communicating that it is a pressable, interactive element — a standard affordance pattern for floating action buttons.
- The ⚡ icon on the FAB suggests speed and quick access, reinforcing its purpose.
- All action buttons use **verb-first labels** ("🔗 Assign Asset", "➕ Add New Asset", "📋 View History", "📦 Inventory") — verbs communicate action, making it immediately clear what will happen when each button is clicked.
- The ✕ close button in the panel header uses a universally understood symbol for dismissal.

---

### 3.6 Flexibility

> The system should be usable by a wide range of users with different skill levels and interaction preferences.

**Application:**  
- The widget is **keyboard accessible**: the FAB has `aria-expanded` and `aria-label` attributes, and can be activated with Enter or Space like any standard button.
- It works on **every route** in the application without any page-specific configuration, making it universally available.
- The panel is **non-blocking**: it uses `aria-modal="false"` so screen readers and keyboard users can still interact with the rest of the page while the panel is open.
- The widget is **responsive**: on screens narrower than 640px, it remains functional and visible even when the sidebar is hidden.

---

### 3.7 Visual Hierarchy

> The most important information should be the most visually prominent, guiding the user's eye in order of importance.

**Application:**  
The panel is structured top-to-bottom in strict order of importance:

| Position | Element | Importance |
|---|---|---|
| Top | Fleet Health bar + percentage | Most critical — tells user if action is even possible |
| Middle | Mini stat badges (free / out / maintenance) | Supporting detail for the health figure |
| Below | Action buttons | Primary purpose of the widget |
| Bottom | Footer ("X assets tracked") | Least critical — contextual metadata |

Typography reinforces this: the health percentage is bold and colour-coded, action button labels are medium weight, and the footer is the smallest and most muted text in the panel.

---

## 4. Widget Structure and Layout

The widget is composed of two parts:

```
QuickActionsWidget
├── Panel (visible only when open === true)
│   ├── Header
│   │   ├── Title: "⚡ Quick Actions"
│   │   └── Close button (✕)
│   ├── Health Section
│   │   ├── Label row: "Fleet Health" + percentage (or loading dot)
│   │   ├── Progress bar (colour-coded, animated)
│   │   └── Mini badges: available / assigned / maintenance counts
│   ├── Actions Section
│   │   ├── 🔗 Assign Asset  (btn-primary)
│   │   ├── ➕ Add New Asset (btn-ghost)
│   │   ├── 📋 View History  (btn-ghost)
│   │   └── 📦 Inventory     (btn-ghost)
│   └── Footer
│       └── "X assets tracked"
└── FAB Button
    └── ⚡ (collapsed) / ✕ (expanded)
```

**Positioning:**  
The widget root (`.qaw-root`) is `position: fixed; bottom: 28px; right: 28px; z-index: 200`, placing it above all other page content in the bottom-right corner.

---

## 5. Functionality Breakdown

### 5.1 Toggle Open / Close

Clicking the FAB toggles the `open` state between `true` and `false`. When `open` is `true`, the panel renders. When `false`, only the FAB is visible.

```
User clicks FAB → open: false → true → Panel renders + API call fires
User clicks FAB again → open: true → false → Panel unmounts
User clicks ✕ in header → open: true → false → Panel unmounts
```

### 5.2 Live Fleet Health

Every time the panel opens, `loadStats()` is called. This function:

1. Sets `loading: true` (shows the pulsing dot)
2. Calls `fetchAssets()` from the API client, which hits `GET /assets`
3. Counts assets by status: total, available, assigned, maintenance
4. Sets `stats` with the counts
5. Sets `loading: false` (hides the pulsing dot, shows the health bar)

The health percentage is calculated as:

```
healthPct = Math.round((available / total) * 100)
```

The bar colour is determined by thresholds:

| Health % | Colour | Meaning |
|---|---|---|
| ≥ 60% | Green (`--success`) | Fleet is healthy, most assets free |
| 30–59% | Amber (`--warning`) | Fleet is partially utilised |
| < 30% | Red (`--danger`) | Fleet is heavily utilised or depleted |

### 5.3 Navigation Actions

Each action button calls the `go(path)` helper:

```javascript
const go = (path) => { setOpen(false); navigate(path); };
```

This closes the panel first, then navigates — ensuring the panel does not remain open on the new page.

| Button | Navigates To | Purpose |
|---|---|---|
| 🔗 Assign Asset | `/assign` | Open the asset assignment form |
| ➕ Add New Asset | `/add-asset` | Open the add asset form (admin only) |
| 📋 View History | `/history` | Open the global assignment history |
| 📦 Inventory | `/inventory` | Open the inventory overview |

---

## 6. State Management

The widget manages three local React state variables:

| State Variable | Type | Initial Value | Purpose |
|---|---|---|---|
| `open` | boolean | `false` | Controls panel visibility |
| `stats` | object / null | `null` | Holds fetched asset counts |
| `loading` | boolean | `false` | Controls loading indicator |

The `stats` object shape when populated:

```javascript
{
  total:       number,  // all assets
  available:   number,  // status === "available"
  assigned:    number,  // status === "assigned"
  maintenance: number   // status === "maintenance"
}
```

**Why local state?**  
The widget's data is transient and only needed while the panel is open. Using local state (rather than global context or Redux) keeps the component self-contained and avoids unnecessary re-renders in the rest of the application.

**Data freshness:**  
Stats are re-fetched every time the panel is opened (not cached), ensuring the user always sees current data. This is intentional — asset status can change at any time due to other users' actions.

---

## 7. Visual Design and Styling

All widget styles are defined in `index.css` under the `/* ── Quick Actions Widget ── */` section.

### Key Style Decisions

**FAB:**
```css
.qaw-fab {
  width: 52px; height: 52px;
  border-radius: 50%;
  background: var(--primary);        /* Blue — matches primary brand colour */
  box-shadow: 0 4px 16px rgba(59,130,246,0.45);  /* Coloured shadow for depth */
  transition: transform 0.15s, background 0.15s;
}
.qaw-fab:hover { transform: scale(1.08); }  /* Subtle grow on hover */
```

**Panel entry animation:**
```css
@keyframes qawSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
The panel slides up from slightly below its final position, giving a natural "popping up" feel.

**Health bar transition:**
```css
.qaw-bar-fill {
  transition: width 0.5s ease, background 0.3s;
}
```
The bar animates its width and colour change, making the data arrival feel smooth rather than jarring.

**Panel width:** Fixed at 272px — wide enough to display all content comfortably, narrow enough not to obscure the page content behind it.

---

## 8. Accessibility

| Feature | Implementation |
|---|---|
| Semantic role | `role="complementary"` on root, `role="dialog"` on panel |
| ARIA label | `aria-label="Quick Actions"` on root, `aria-label="Close widget"` on close button |
| ARIA expanded | `aria-expanded={open}` on FAB reflects current state to screen readers |
| Non-blocking modal | `aria-modal="false"` — page content remains accessible when panel is open |
| Keyboard navigation | All interactive elements are native `<button>` elements, focusable by default |
| Colour + text | Health status is communicated by both colour AND text percentage — not colour alone |

---

## 9. Integration with the Application

### Mounting Point

The widget is mounted in `App.js` inside the `<ToastProvider>` but outside the `<Routes>` block, ensuring it persists across all page navigations:

```jsx
// App.js
<ToastProvider>
  <div className="layout">
    <Sidebar />
    <div className="main">
      ...
      <main className="page-content">
        <Routes> ... </Routes>
      </main>
    </div>
  </div>
  <QuickActionsWidget />   {/* ← mounted here, outside Routes */}
</ToastProvider>
```

### API Dependency

The widget calls `fetchAssets()` from `api/client.js`, which makes a `GET /assets` request to the Flask backend. This is the same endpoint used by the Dashboard and Inventory pages — no new backend endpoints were required.

### Authentication Awareness

After the authentication system was added, `fetchAssets()` in `client.js` automatically attaches the `Authorization: Bearer <token>` header. The widget inherits this behaviour without any changes, since it uses the same `fetchAssets` function.

### Files Modified / Created

| File | Change |
|---|---|
| `react_app/src/components/QuickActionsWidget.js` | Created — the widget component |
| `react_app/src/index.css` | Added widget CSS block |
| `react_app/src/App.js` | Imported and mounted `<QuickActionsWidget />` |

---

## 10. Screenshots

The following screenshots demonstrate the widget in each of its states. Paste your actual screenshots in the spaces indicated below.

---

### Screenshot 1 — Widget in Collapsed State (FAB Only)

> Paste screenshot here — shows the application Dashboard page with the blue ⚡ FAB button visible in the bottom-right corner. The rest of the page is fully visible and unobstructed.

```
[ SCREENSHOT 1 — FAB collapsed state, bottom-right corner of Dashboard ]
```

**What to show:** The full Dashboard page with the small circular blue button in the bottom-right. Annotate the FAB with an arrow and label "Quick Actions FAB".

---

### Screenshot 2 — Widget Panel Open (Loading State)

> Paste screenshot here — shows the panel immediately after clicking the FAB, while the API call is in progress. The pulsing loading dot should be visible next to "Fleet Health" and the health bar should be empty.

```
[ SCREENSHOT 2 — Panel open, loading state with pulsing dot visible ]
```

**What to show:** The expanded panel with the header, the "Fleet Health" label with the animated dot, and the empty bar. The action buttons should be visible below.

---

### Screenshot 3 — Widget Panel Open (Data Loaded, Healthy Fleet)

> Paste screenshot here — shows the panel fully loaded with a green health bar (fleet health ≥ 60%). The percentage, mini badges, and all four action buttons should be visible.

```
[ SCREENSHOT 3 — Panel open, green health bar, all stats visible ]
```

**What to show:** The complete panel with green bar, percentage (e.g. "75%"), the three mini badges (✅ X free, 🔗 X out, 🔧 X maint.), and all four action buttons. Annotate each section.

---

### Screenshot 4 — Widget Panel Open (Amber / Red Health)

> Paste screenshot here — shows the panel with an amber or red health bar, indicating most assets are assigned or in maintenance.

```
[ SCREENSHOT 4 — Panel open, amber or red health bar ]
```

**What to show:** Same panel layout but with the bar and percentage rendered in amber (`#f59e0b`) or red (`#ef4444`). This demonstrates the dynamic colour feedback behaviour.

---

### Screenshot 5 — Widget Visible on a Non-Dashboard Page

> Paste screenshot here — shows the widget FAB visible on a page other than the Dashboard (e.g. the Inventory or History page), demonstrating that it persists across all routes.

```
[ SCREENSHOT 5 — FAB visible on Inventory or History page ]
```

**What to show:** The Inventory or History page with the FAB in the bottom-right corner, proving the widget is not page-specific.

---

### Screenshot 6 — Navigation in Action

> Paste screenshot here — shows the result of clicking one of the action buttons (e.g. "🔗 Assign Asset"), demonstrating that the panel closes and the user is taken to the Assign page.

```
[ SCREENSHOT 6 — Assign Asset page after clicking the widget button ]
```

**What to show:** The Assign Asset page loaded, with the FAB visible in the bottom-right (panel closed). This demonstrates the close-then-navigate behaviour.

---

## 11. Code Walkthrough

### Full Component Code

```jsx
// react_app/src/components/QuickActionsWidget.js

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAssets } from "../api/client";

export default function QuickActionsWidget() {
  const [open, setOpen]       = useState(false);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate              = useNavigate();

  // Fetch live asset counts from the API
  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const assets      = await fetchAssets();
      const total       = assets.length;
      const available   = assets.filter(a => a.status === "available").length;
      const assigned    = assets.filter(a => a.status === "assigned").length;
      const maintenance = assets.filter(a => a.status === "maintenance").length;
      setStats({ total, available, assigned, maintenance });
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch every time the panel is opened
  useEffect(() => { if (open) loadStats(); }, [open, loadStats]);

  // Close panel and navigate
  const go = (path) => { setOpen(false); navigate(path); };

  // Compute health percentage and colour
  const healthPct = stats ? Math.round((stats.available / stats.total) * 100) : 0;
  const healthColor =
    healthPct >= 60 ? "var(--success)" :
    healthPct >= 30 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="qaw-root" role="complementary" aria-label="Quick Actions">

      {/* Panel — only rendered when open */}
      {open && (
        <div className="qaw-panel" role="dialog" aria-modal="false">

          {/* Header */}
          <div className="qaw-header">
            <span className="qaw-title">⚡ Quick Actions</span>
            <button className="qaw-close" onClick={() => setOpen(false)}
              aria-label="Close widget">✕</button>
          </div>

          {/* Fleet Health */}
          <div className="qaw-health">
            <div className="qaw-health-label">
              <span>Fleet Health</span>
              {loading
                ? <span className="qaw-loading-dot" />
                : <span style={{ color: healthColor, fontWeight: 600 }}>{healthPct}%</span>
              }
            </div>
            <div className="qaw-bar-track">
              <div className="qaw-bar-fill"
                style={{ width: loading ? "0%" : `${healthPct}%`, background: healthColor }} />
            </div>
            {stats && !loading && (
              <div className="qaw-mini-stats">
                <span className="badge available">✅ {stats.available} free</span>
                <span className="badge assigned">🔗 {stats.assigned} out</span>
                <span className="badge maintenance">🔧 {stats.maintenance} maint.</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="qaw-actions">
            <button className="btn btn-primary qaw-btn" onClick={() => go("/assign")}>
              🔗 Assign Asset
            </button>
            <button className="btn btn-ghost qaw-btn" onClick={() => go("/add-asset")}>
              ➕ Add New Asset
            </button>
            <button className="btn btn-ghost qaw-btn" onClick={() => go("/history")}>
              📋 View History
            </button>
            <button className="btn btn-ghost qaw-btn" onClick={() => go("/inventory")}>
              📦 Inventory
            </button>
          </div>

          {/* Footer */}
          <div className="qaw-footer">
            {stats ? `${stats.total} assets tracked` : "Loading…"}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        className={`qaw-fab ${open ? "qaw-fab--open" : ""}`}
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label="Toggle quick actions"
      >
        {open ? "✕" : "⚡"}
      </button>
    </div>
  );
}
```

### Key Code Decisions Explained

**`useCallback` for `loadStats`:**  
Wrapping `loadStats` in `useCallback` prevents it from being recreated on every render, which would cause the `useEffect` to fire in an infinite loop since `loadStats` is listed as a dependency.

**Conditional rendering `{open && <Panel />}`:**  
The panel is fully unmounted when closed (not just hidden with CSS). This means React cleans up the component, and the next time it opens, it starts fresh — which is why `stats` is reset and the API is called again.

**`go()` closes before navigating:**  
`setOpen(false)` is called before `navigate(path)`. This ensures the panel is not briefly visible on the new page during the React render cycle.

---

## 12. Design Decisions and Trade-offs

| Decision | Rationale | Trade-off |
|---|---|---|
| Local state only (no Redux/Context) | Widget is self-contained; data is transient | Stats are re-fetched on every open (minor extra API call) |
| Re-fetch on every open | Always shows current data | Slightly slower than caching, but ensures accuracy |
| Fixed position, z-index 200 | Always accessible regardless of scroll position | May overlap content on very small screens |
| Panel width fixed at 272px | Consistent layout, fits all content | Not adjustable by user |
| No caching of stats | Simplicity; avoids stale data | One extra GET /assets call per panel open |
| Collapse-then-navigate pattern | Prevents panel appearing on new page | Adds ~1 frame of delay before navigation |
| Reuse existing CSS classes | Consistency with design system | Widget appearance is tied to global styles |

---

*End of Document*
