"""
seed_auth.py — run once to set passwords for existing users and create admin.

Usage:  python3 seed_auth.py
"""
import sys
sys.path.insert(0, ".")

from app import create_app
from extensions import db, bcrypt
from models.user import User

app = create_app()

with app.app_context():
    # Create a default admin if none exists
    admin = User.query.filter_by(email="admin@company.com").first()
    if not admin:
        admin = User(name="Admin", email="admin@company.com", role="admin")
        db.session.add(admin)
        print("Created admin user: admin@company.com")
    admin.password_hash = bcrypt.generate_password_hash("admin123").decode("utf-8")
    admin.role = "admin"

    # Give every other user a default password (they should change it)
    for user in User.query.filter(User.email != "admin@company.com").all():
        if not user.password_hash:
            user.password_hash = bcrypt.generate_password_hash("password123").decode("utf-8")
            print(f"Set default password for: {user.email}")

    db.session.commit()
    print("\nDone. Credentials:")
    print("  Admin  → admin@company.com  / admin123")
    print("  Others → <their email>      / password123")
