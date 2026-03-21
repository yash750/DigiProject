# Asset Tracker — React Frontend (Experimental)

This is a standalone React app that talks to the **existing Flask API**.
Your original Flask templates are completely untouched.

## Features added over the original UI

| Feature | Details |
|---|---|
| Sidebar navigation | Dashboard · Assign · History · Inventory |
| Stat cards | Total / Available / Assigned / Maintenance counts |
| Bar chart | Asset distribution by type (Recharts) |
| Pie chart | Overall status breakdown |
| Search & filter | Live search by name, serial, holder + status filter |
| Assign form | Notes field, live available-assets panel, validation |
| History timeline | Colour-coded dots, timestamps, notes |
| Inventory page | Per-type stock table + quick stats panel |
| Toast notifications | Success / error feedback on every action |
| Loading spinners | Shown while API calls are in flight |

## Setup

```bash
cd react_app
npm install
npm start          # opens http://localhost:3000
```

Keep Flask running on port 5000 at the same time:

```bash
# from project root
flask run          # or: python app.py
```

The React app proxies all `/assets`, `/users`, `/assign`, `/return/*`,
and `/asset/*/history/json` calls to `http://localhost:5000` automatically
(configured via `"proxy"` in `package.json`).

## New Flask endpoint added

`GET /asset/<id>/history/json` — returns assignment history as JSON.
This is the only change made to the existing Flask code (plus a CORS header
in `app.py` so the dev server can communicate).
