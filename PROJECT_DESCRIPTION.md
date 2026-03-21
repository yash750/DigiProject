# Asset Management System

## Project Overview

A comprehensive web-based asset management system designed to track, assign, and monitor organizational assets such as laptops, cameras, tools, and other shared equipment. The system provides complete visibility into asset ownership, transfer history, and availability status while ensuring accountability and auditability.

## Key Features

### Core Functionality
- **Asset Inventory Management**: Track all organizational assets with unique serial numbers and status monitoring
- **Assignment Tracking**: Assign assets to users with complete custody chain documentation
- **Real-time Dashboard**: View asset availability, current assignments, and inventory summary
- **Audit Trail**: Comprehensive history of all asset transfers and returns
- **Status Management**: Track asset lifecycle from available to assigned, maintenance, or retired

### Technical Highlights
- **Immutable History**: Assignment-based tracking ensures complete audit trail
- **Derived State Management**: Current ownership calculated dynamically to prevent data inconsistencies
- **Performance Optimized**: Efficient database queries with proper relationship loading
- **RESTful API**: JSON endpoints for programmatic access and integration

## Technology Stack

- **Backend**: Python Flask with SQLAlchemy ORM
- **Database**: SQLite with Flask-Migrate for schema management
- **Frontend**: HTML templates with CSS styling
- **Architecture**: MVC pattern with separate models, routes, and services

## System Architecture

### Database Design
- **Users Table**: Store user information and contact details
- **Assets Table**: Asset details with serial numbers and status
- **Assignments Table**: Complete transfer history with timestamps

### Key Design Decisions
- Assignment-based tracking instead of simple ownership fields
- Calculated current holder to maintain data integrity
- Cascade deletion for data consistency
- Status enumeration for standardized asset states

## Use Cases

### Primary Users
- **IT Administrators**: Manage asset inventory and assignments
- **Employees**: Request and return organizational equipment
- **Management**: Monitor asset utilization and accountability

### Business Benefits
- Eliminate manual spreadsheet tracking
- Reduce asset loss and misplacement
- Ensure compliance and accountability
- Optimize asset utilization
- Streamline equipment checkout/return process

## Project Structure

```
Assets_Management/
├── app.py              # Flask application entry point
├── config.py           # Configuration settings
├── extensions.py       # Database extensions
├── models/             # Data models (User, Asset, Assignment)
├── routes/             # API endpoints and web routes
├── services/           # Business logic layer
├── templates/          # HTML user interface
├── static/             # CSS and static assets
├── migrations/         # Database schema versions
└── instance/           # SQLite database file
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Dashboard with asset overview |
| GET | `/assets` | List all assets (JSON) |
| GET | `/users` | List all users (JSON) |
| POST | `/assign` | Assign asset to user |
| POST | `/return/<id>` | Return asset to inventory |
| GET | `/asset/<id>/history` | View asset transfer history |

## Installation & Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd DigiProject
   ```

2. **Create Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # or venv\Scripts\activate  # Windows
   ```

3. **Install Dependencies**
   ```bash
   pip install flask flask-sqlalchemy flask-migrate
   ```

4. **Initialize Database**
   ```bash
   flask db init
   flask db migrate -m "initial schema"
   flask db upgrade
   ```

5. **Seed Test Data**
   ```bash
   python seed.py
   ```

6. **Run Application**
   ```bash
   flask run
   ```

## Future Enhancements

### Potential Features
- User authentication and role-based access
- Email notifications for assignments and returns
- Asset maintenance scheduling
- Barcode/QR code scanning
- Mobile application
- Advanced reporting and analytics
- Integration with procurement systems

### Scalability Considerations
- Database migration to PostgreSQL for production
- Caching layer for improved performance
- Microservices architecture for large deployments
- API rate limiting and security enhancements

## Project Goals

This asset management system was developed to demonstrate:
- Clean system architecture and design patterns
- Database modeling for audit trails and data integrity
- RESTful API design principles
- Performance optimization techniques
- Real-world business problem solving

The focus remains on core functionality, data consistency, and system reliability rather than extensive feature sets, making it a solid foundation for organizational asset tracking needs.