# Seed Data Reference

> Dummy data populated by `python seed.py`.  
> Two fully isolated organizations, each with their own admin, employees, assets, assignments, and audit logs.

---

## Organizations

| # | Name | Slug |
|---|------|------|
| 1 | TechNova Solutions | `technova-solutions` |
| 2 | BrightBridge Corp | `brightbridge-corp` |

---

## Organization 1 — TechNova Solutions

### Users

| Role | Name | Email | Password | Department | Job Title | Phone |
|------|------|-------|----------|------------|-----------|-------|
| Admin | Amit Sharma | admin@technova.com | `admin123` | IT | IT Manager | +91 98100 11111 |
| Employee | Rahul Verma | rahul@technova.com | `password123` | Engineering | Software Engineer | +91 98100 22222 |
| Employee | Sneha Patel | sneha@technova.com | `password123` | Design | UI/UX Designer | +91 98100 33333 |
| Employee | Arjun Mehta | arjun@technova.com | `password123` | QA | QA Engineer | +91 98100 44444 |

---

### Assets

| Serial Number | Name | Status |
|---------------|------|--------|
| TN-DL-001 | Dell Laptop | Assigned |
| TN-DL-002 | Dell Laptop | Available |
| TN-CC-001 | Canon Camera | Assigned |
| TN-CC-002 | Canon Camera | Available |
| TN-PJ-001 | Projector | Available |
| TN-TD-001 | Testing Device | Maintenance |
| TN-IP-001 | iPad Pro | Assigned |

**Summary:** 7 assets — 3 assigned, 1 maintenance, 3 available

---

### Active Assignments

| Asset | Serial | Assigned To | Assigned By | Days Ago | Notes |
|-------|--------|-------------|-------------|----------|-------|
| Dell Laptop | TN-DL-001 | Rahul Verma | Amit Sharma | 10 days | For project Alpha development |
| Canon Camera | TN-CC-001 | Sneha Patel | Amit Sharma | 5 days | Product shoot for Q2 campaign |
| iPad Pro | TN-IP-001 | Arjun Mehta | Amit Sharma | 3 days | Mobile testing |

---

### Completed Assignments (Returned)

| Asset | Serial | Assigned To | Assigned By | Assigned | Returned | Notes |
|-------|--------|-------------|-------------|----------|----------|-------|
| Projector | TN-PJ-001 | Arjun Mehta | Amit Sharma | 15 days ago | 8 days ago | Team presentation |

---

### Audit Log (Asset Logs)

| Event | Asset | Serial | Actor | Detail | When |
|-------|-------|--------|-------|--------|------|
| created | Dell Laptop | TN-DL-001 | Amit Sharma | Initial status: available | 30 days ago |
| created | Dell Laptop | TN-DL-002 | Amit Sharma | Initial status: available | 30 days ago |
| created | Canon Camera | TN-CC-001 | Amit Sharma | Initial status: available | 28 days ago |
| created | Canon Camera | TN-CC-002 | Amit Sharma | Initial status: available | 28 days ago |
| created | Projector | TN-PJ-001 | Amit Sharma | Initial status: available | 25 days ago |
| created | Testing Device | TN-TD-001 | Amit Sharma | Initial status: maintenance | 20 days ago |
| created | iPad Pro | TN-IP-001 | Amit Sharma | Initial status: available | 14 days ago |
| assigned | Projector | TN-PJ-001 | Amit Sharma | Assigned to Arjun Mehta — Team presentation | 15 days ago |
| assigned | Dell Laptop | TN-DL-001 | Amit Sharma | Assigned to Rahul Verma — For project Alpha development | 10 days ago |
| returned | Projector | TN-PJ-001 | Arjun Mehta | Returned by Arjun Mehta | 8 days ago |
| assigned | Canon Camera | TN-CC-001 | Amit Sharma | Assigned to Sneha Patel — Product shoot for Q2 campaign | 5 days ago |
| assigned | iPad Pro | TN-IP-001 | Amit Sharma | Assigned to Arjun Mehta — Mobile testing | 3 days ago |

---

## Organization 2 — BrightBridge Corp

### Users

| Role | Name | Email | Password | Department | Job Title | Phone |
|------|------|-------|----------|------------|-----------|-------|
| Admin | Neha Kapoor | admin@brightbridge.com | `admin123` | Operations | Operations Manager | +91 99200 11111 |
| Employee | Priya Singh | priya@brightbridge.com | `password123` | Marketing | Marketing Executive | +91 99200 22222 |
| Employee | Karan Joshi | karan@brightbridge.com | `password123` | Sales | Sales Associate | +91 99200 33333 |

---

### Assets

| Serial Number | Name | Status |
|---------------|------|--------|
| BB-MB-001 | MacBook Pro | Assigned |
| BB-MB-002 | MacBook Pro | Available |
| BB-PJ-001 | Projector | Available |
| BB-WC-001 | Webcam HD | Assigned |
| BB-WC-002 | Webcam HD | Retired |

**Summary:** 5 assets — 2 assigned, 1 retired, 2 available

---

### Active Assignments

| Asset | Serial | Assigned To | Assigned By | Days Ago | Notes |
|-------|--------|-------------|-------------|----------|-------|
| MacBook Pro | BB-MB-001 | Priya Singh | Neha Kapoor | 7 days | Campaign content creation |
| Webcam HD | BB-WC-001 | Karan Joshi | Neha Kapoor | 2 days | Client video calls |

---

### Completed Assignments (Returned)

| Asset | Serial | Assigned To | Assigned By | Assigned | Returned | Notes |
|-------|--------|-------------|-------------|----------|----------|-------|
| MacBook Pro | BB-MB-002 | Karan Joshi | Neha Kapoor | 20 days ago | 12 days ago | Temporary loan during onboarding |

---

### Audit Log (Asset Logs)

| Event | Asset | Serial | Actor | Detail | When |
|-------|-------|--------|-------|--------|------|
| created | MacBook Pro | BB-MB-001 | Neha Kapoor | Initial status: available | 40 days ago |
| created | MacBook Pro | BB-MB-002 | Neha Kapoor | Initial status: available | 40 days ago |
| created | Projector | BB-PJ-001 | Neha Kapoor | Initial status: available | 35 days ago |
| created | Webcam HD | BB-WC-001 | Neha Kapoor | Initial status: available | 30 days ago |
| created | Webcam HD | BB-WC-002 | Neha Kapoor | Initial status: retired | 30 days ago |
| assigned | MacBook Pro | BB-MB-002 | Neha Kapoor | Assigned to Karan Joshi — Temporary loan during onboarding | 20 days ago |
| returned | MacBook Pro | BB-MB-002 | Karan Joshi | Returned by Karan Joshi | 12 days ago |
| assigned | MacBook Pro | BB-MB-001 | Neha Kapoor | Assigned to Priya Singh — Campaign content creation | 7 days ago |
| assigned | Webcam HD | BB-WC-001 | Neha Kapoor | Assigned to Karan Joshi — Client video calls | 2 days ago |

---

## Quick Login Reference

| Organization | Role | Email | Password |
|---|---|---|---|
| TechNova Solutions | Admin | admin@technova.com | `admin123` |
| TechNova Solutions | Employee | rahul@technova.com | `password123` |
| TechNova Solutions | Employee | sneha@technova.com | `password123` |
| TechNova Solutions | Employee | arjun@technova.com | `password123` |
| BrightBridge Corp | Admin | admin@brightbridge.com | `admin123` |
| BrightBridge Corp | Employee | priya@brightbridge.com | `password123` |
| BrightBridge Corp | Employee | karan@brightbridge.com | `password123` |

---

## Data Isolation Verification

Each organization's data is fully isolated by `org_id`. Logging in as any TechNova user will **never** show BrightBridge assets, employees, or history — and vice versa.

| Table | Isolation Column |
|-------|-----------------|
| `users` | `org_id` |
| `assets` | `org_id` |
| `asset_logs` | `org_id` |
| `assignments` | via `asset.org_id` |

Serial numbers are unique **per organization**, not globally. `TN-DL-001` and `BB-MB-001` can coexist because they belong to different orgs.
