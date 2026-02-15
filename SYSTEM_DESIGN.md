# System Design Document
## Asset Management System

---

## 1. Users

### 1.1 User Types
- **IT Administrators** - Manage asset inventory, assign/return assets, monitor system
- **Employees** - Receive asset assignments, return assets
- **Management** - View asset utilization and audit trails

### 1.2 User Scale
- **Current Capacity**: Single organization (10-500 users)
- **Concurrent Users**: 20-50 active sessions
- **User Roles**: 2 roles (admin, employee)

---

## 2. Features

### 2.1 Core Features
- **Asset Inventory Management** - Track assets with unique serial numbers and status
- **Asset Assignment** - Assign assets to users with custody transfer
- **Asset Return** - Return assets to available inventory
- **Real-time Dashboard** - View asset status, current holders, inventory summary
- **Audit Trail** - Complete history of asset transfers with timestamps
- **Status Tracking** - Monitor asset lifecycle (available, assigned, maintenance, retired)

### 2.2 API Endpoints
| Method | Endpoint | Functionality |
|--------|----------|---------------|
| GET | `/` | Dashboard with asset overview |
| GET | `/assets` | List all assets (JSON) |
| GET | `/users` | List all users (JSON) |
| POST | `/assign` | Assign asset to user |
| POST | `/return/<id>` | Return asset to inventory |
| GET | `/asset/<id>/history` | View asset transfer history |
| GET | `/assign-page` | Assignment form UI |

---

## 3. Components

### 3.1 Frontend
- **Technology**: HTML5, CSS3
- **Templates**: Jinja2 templating engine
- **Pages**:
  - `dashboard.html` - Asset list and inventory summary
  - `assign.html` - Asset assignment form
  - `history.html` - Asset transfer audit log
  - `index.html` - Landing page
- **Styling**: Custom CSS (`static/style.css`)

### 3.2 Backend
- **Framework**: Flask (Python web framework)
- **Architecture**: MVC pattern
- **Modules**:
  - `app.py` - Application entry point and initialization
  - `routes/asset_routes.py` - API and UI route handlers
  - `services/asset_service.py` - Business logic layer
  - `models/` - Database models (User, Asset, Assignment)
  - `config.py` - Application configuration
  - `extensions.py` - Database extensions

### 3.3 Database
- **Database**: SQLite
- **ORM**: SQLAlchemy
- **Migration Tool**: Flask-Migrate (Alembic)
- **Schema**:
  - **users** - User information (id, name, email, role)
  - **assets** - Asset details (id, name, serial_number, status)
  - **assignments** - Transfer history (id, asset_id, assigned_to_user_id, assigned_by_user_id, assigned_at, returned_at, notes)
- **Indexes**: Composite index on (asset_id, returned_at) for performance

### 3.4 External APIs
- **None** - Self-contained system with no external dependencies

---

## 4. Tech Stack

### 4.1 Backend Technologies
- **Python 3.x** - Programming language
- **Flask** - Web framework
- **SQLAlchemy** - ORM for database operations
- **Flask-Migrate** - Database migration management
- **Alembic** - Schema versioning

### 4.2 Frontend Technologies
- **HTML5** - Markup
- **CSS3** - Styling
- **Jinja2** - Template engine

### 4.3 Database
- **SQLite** - Relational database

### 4.4 Development Tools
- **Virtual Environment** - Python venv
- **Version Control** - Git

---

## 5. Architecture

### 5.1 Design Pattern
- **MVC (Model-View-Controller)**
  - Models: Database entities (User, Asset, Assignment)
  - Views: HTML templates
  - Controllers: Route handlers and services

### 5.2 Key Design Decisions
- **Assignment-based Tracking** - Immutable audit trail using dedicated Assignment table
- **Derived State** - Current holder calculated dynamically from latest open assignment
- **Status Enumeration** - Standardized asset states


### 5.3 Data Flow
```
User Request → Flask Routes → Service Layer → SQLAlchemy ORM → SQLite Database
                    ↓
              Jinja2 Templates → HTML Response
```

---

## 6. Database Schema

### 6.1 Entity Relationships
- User (1) → (N) Assignments (assigned_to)
- User (1) → (N) Assignments (assigned_by)
- Asset (1) → (N) Assignments
- Asset → current_holder (derived property)

