# Shared Asset Custody System

> A web-based system to track ownership, transfer history, and availability of shared organizational assets (laptops, cameras, tools, devices, etc.).

This project focuses on the **clarity**, **accountability**, and **auditability** of shared assets, replacing manual spreadsheets with a robust database-backed application.

---

## 📂 Project Structure

```text
DigiProject/
│
├── app.py                # Application entry point
├── config.py             # Configuration settings
├── extensions.py         # DB and Migration extensions
├── seed.py               # Script to populate dummy data
│
├── models/               # Database models (User, Asset, Assignment)
├── services/             # Business logic layer
├── routes/               # API and UI routes
├── templates/            # HTML templates
└── static/               # CSS and assets
```

---

## Setup Instructions (Run Locally)

Follow these steps to get the project running on your local machine.

### 1. Clone the Repository
```bash
git clone <repo-link>
cd DigiProject
```

### 2. Create Virtual Environment
```bash
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install flask flask-sqlalchemy flask-migrate
```

### 4. Initialize Database
Run these commands to set up the SQLite database schema (first time only).
```bash
flask db init
flask db migrate -m "initial schema"
flask db upgrade
```

### 5. Seed Dummy Data
Populate the database with test users and assets.
```bash
python seed.py
```

### 6. Run the Application
```bash
flask run
```
Open your browser and navigate to: `http://127.0.0.1:5000`

---

## 🖥️ Application Overview

### Available Pages

| Route | Description |
| :--- | :--- |
| `/` | **Dashboard**: View asset list, status, and inventory summary. |
| `/assign-page` | **Assignment Portal**: Form to transfer assets between users. |
| `/asset/<id>/history` | **Audit Log**: View the full custody history of a specific item. |

### API Endpoints

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/assets` | List all assets in JSON format. |
| `GET` | `/users` | List all registered users. |
| `POST` | `/assign` | Assign an asset to a user. |
| `POST` | `/return/<id>` | Mark an asset as returned/available. |

---

## System Design Decisions

This project was built with a focus on system integrity rather than just features.

* **Assignment Table for Audit Trail:** Instead of simply storing a `current_owner` on the Asset table, we use a dedicated `Assignment` table. This creates an immutable history log of every transfer.
* **Derived State:** The "Current Holder" is calculated dynamically based on the latest open assignment. This prevents **State Drift** (where the history says one thing, but the asset table says another).
* **Performance Optimization:** Solved the *N+1 query problem* by using efficient SQLAlchemy loading strategies and aggregation for the inventory summary.
* **Aggregation View:** Added a real-time "Inventory Summary" on the dashboard to show stock levels at a glance without expensive calculations on the frontend.
* **Minimalist UI:** The interface is kept simple to strictly focus on the system design and data modeling aspects.

---

## ⚠️ Out of Scope

To maintain focus on core custody tracking and accountability, the following were intentionally **excluded**:

* Notifications (Email/SMS)
* Predictive Maintenance
* Advanced Search/Filtering
* Authentication (Login/Signup)

---

> **Note by Author:**
> Built as part of a Product Engineering assignment focused on system design and real-world modeling of shared resources.
