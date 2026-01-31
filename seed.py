from app import create_app
from extensions import db
from models.user import User
from models.asset import Asset
from models.assignment import Assignment
from datetime import datetime, timezone

app = create_app()

with app.app_context():
    # Clear old data
    Assignment.query.delete()
    Asset.query.delete()
    User.query.delete()
    db.session.commit()

    # Users
    users = [
        User(name="Rahul", email="rahul@test.com", role="employee"),
        User(name="Sneha", email="sneha@test.com", role="admin"),
        User(name="Arjun", email="arjun@test.com", role="employee"),
        User(name="Priya", email="priya@test.com", role="employee")
    ]
    db.session.add_all(users)
    db.session.commit()

    # Assets
    assets = [
        Asset(name="Dell Laptop", serial_number="DL123"),
        Asset(name="Canon Camera", serial_number="CC456"),
        Asset(name="Testing Device", serial_number="TD789"),
        Asset(name="Projector", serial_number="PJ101")
    ]
    db.session.add_all(assets)
    db.session.commit()

    # Assignment history
    a1 = Assignment(
        asset_id=assets[0].id,
        assigned_to_user_id=users[0].id,
        assigned_by_user_id=users[1].id,
        assigned_at=datetime.now(timezone.utc)
    )
    assets[0].status = Asset.STATUS_ASSIGNED

    a2 = Assignment(
        asset_id=assets[1].id,
        assigned_to_user_id=users[2].id,
        assigned_by_user_id=users[1].id,
        assigned_at=datetime.now(timezone.utc)
    )
    assets[1].status = Asset.STATUS_ASSIGNED

    db.session.add_all([a1, a2])
    db.session.commit()

    print("Dummy data inserted successfully!")
