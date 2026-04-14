"""
seed.py — Populate the database with two sample organizations.

Usage:
    python seed.py

Organizations created:
    1. TechNova Solutions  → admin: admin@technova.com  / admin123
                             employees: rahul / sneha / arjun  (password123)

    2. BrightBridge Corp   → admin: admin@brightbridge.com / admin123
                             employees: priya / karan          (password123)
"""

from app import create_app
from extensions import db, bcrypt
from models.organization import Organization
from models.user import User
from models.asset import Asset
from models.assignment import Assignment
from models.asset_log import AssetLog
from datetime import datetime, timezone, timedelta

app = create_app()

def pw(plain):
    return bcrypt.generate_password_hash(plain).decode("utf-8")

def ago(days=0, hours=0):
    return datetime.now(timezone.utc) - timedelta(days=days, hours=hours)

with app.app_context():

    # ── Wipe existing data (order matters for FK constraints) ──────────────
    AssetLog.query.delete()
    Assignment.query.delete()
    Asset.query.delete()
    User.query.delete()
    Organization.query.delete()
    db.session.commit()

    # ══════════════════════════════════════════════════════════════════════
    # ORGANIZATION 1 — TechNova Solutions
    # ══════════════════════════════════════════════════════════════════════
    tn = Organization(name="TechNova Solutions", slug="technova-solutions")
    db.session.add(tn)
    db.session.flush()

    # Admin
    tn_admin = User(
        org_id=tn.id, role="admin",
        name="Amit Sharma", email="admin@technova.com",
        password_hash=pw("admin123"),
        department="IT", job_title="IT Manager", phone="+91 98100 11111",
    )
    # Employees
    tn_rahul = User(
        org_id=tn.id, role="employee",
        name="Rahul Verma", email="rahul@technova.com",
        password_hash=pw("password123"),
        department="Engineering", job_title="Software Engineer", phone="+91 98100 22222",
    )
    tn_sneha = User(
        org_id=tn.id, role="employee",
        name="Sneha Patel", email="sneha@technova.com",
        password_hash=pw("password123"),
        department="Design", job_title="UI/UX Designer", phone="+91 98100 33333",
    )
    tn_arjun = User(
        org_id=tn.id, role="employee",
        name="Arjun Mehta", email="arjun@technova.com",
        password_hash=pw("password123"),
        department="QA", job_title="QA Engineer", phone="+91 98100 44444",
    )
    db.session.add_all([tn_admin, tn_rahul, tn_sneha, tn_arjun])
    db.session.flush()

    # Assets — TechNova
    tn_assets = [
        Asset(org_id=tn.id, name="Dell Laptop",    serial_number="TN-DL-001", status="assigned"),
        Asset(org_id=tn.id, name="Dell Laptop",    serial_number="TN-DL-002", status="available"),
        Asset(org_id=tn.id, name="Canon Camera",   serial_number="TN-CC-001", status="assigned"),
        Asset(org_id=tn.id, name="Canon Camera",   serial_number="TN-CC-002", status="available"),
        Asset(org_id=tn.id, name="Projector",      serial_number="TN-PJ-001", status="available"),
        Asset(org_id=tn.id, name="Testing Device", serial_number="TN-TD-001", status="maintenance"),
        Asset(org_id=tn.id, name="iPad Pro",       serial_number="TN-IP-001", status="assigned"),
    ]
    db.session.add_all(tn_assets)
    db.session.flush()

    # Assignments — TechNova
    tn_a1 = Assignment(
        asset_id=tn_assets[0].id,
        assigned_to_user_id=tn_rahul.id,
        assigned_by_user_id=tn_admin.id,
        assigned_at=ago(days=10),
        notes="For project Alpha development",
    )
    tn_a2 = Assignment(
        asset_id=tn_assets[2].id,
        assigned_to_user_id=tn_sneha.id,
        assigned_by_user_id=tn_admin.id,
        assigned_at=ago(days=5),
        notes="Product shoot for Q2 campaign",
    )
    tn_a3_returned = Assignment(
        asset_id=tn_assets[4].id,           # Projector — now available (returned)
        assigned_to_user_id=tn_arjun.id,
        assigned_by_user_id=tn_admin.id,
        assigned_at=ago(days=15),
        returned_at=ago(days=8),
        notes="Team presentation",
    )
    tn_a4 = Assignment(
        asset_id=tn_assets[6].id,           # iPad Pro
        assigned_to_user_id=tn_arjun.id,
        assigned_by_user_id=tn_admin.id,
        assigned_at=ago(days=3),
        notes="Mobile testing",
    )
    db.session.add_all([tn_a1, tn_a2, tn_a3_returned, tn_a4])

    # Asset logs — TechNova
    tn_logs = [
        AssetLog(org_id=tn.id, event="created", asset_id=tn_assets[0].id, asset_name="Dell Laptop",    serial_number="TN-DL-001", actor="Amit Sharma",  detail="Initial status: available",    timestamp=ago(days=30)),
        AssetLog(org_id=tn.id, event="created", asset_id=tn_assets[1].id, asset_name="Dell Laptop",    serial_number="TN-DL-002", actor="Amit Sharma",  detail="Initial status: available",    timestamp=ago(days=30)),
        AssetLog(org_id=tn.id, event="created", asset_id=tn_assets[2].id, asset_name="Canon Camera",   serial_number="TN-CC-001", actor="Amit Sharma",  detail="Initial status: available",    timestamp=ago(days=28)),
        AssetLog(org_id=tn.id, event="created", asset_id=tn_assets[3].id, asset_name="Canon Camera",   serial_number="TN-CC-002", actor="Amit Sharma",  detail="Initial status: available",    timestamp=ago(days=28)),
        AssetLog(org_id=tn.id, event="created", asset_id=tn_assets[4].id, asset_name="Projector",      serial_number="TN-PJ-001", actor="Amit Sharma",  detail="Initial status: available",    timestamp=ago(days=25)),
        AssetLog(org_id=tn.id, event="created", asset_id=tn_assets[5].id, asset_name="Testing Device", serial_number="TN-TD-001", actor="Amit Sharma",  detail="Initial status: maintenance",  timestamp=ago(days=20)),
        AssetLog(org_id=tn.id, event="created", asset_id=tn_assets[6].id, asset_name="iPad Pro",       serial_number="TN-IP-001", actor="Amit Sharma",  detail="Initial status: available",    timestamp=ago(days=14)),
        AssetLog(org_id=tn.id, event="assigned", asset_id=tn_assets[0].id, asset_name="Dell Laptop",   serial_number="TN-DL-001", actor="Amit Sharma",  detail="Assigned to Rahul Verma — For project Alpha development", timestamp=ago(days=10)),
        AssetLog(org_id=tn.id, event="assigned", asset_id=tn_assets[4].id, asset_name="Projector",     serial_number="TN-PJ-001", actor="Amit Sharma",  detail="Assigned to Arjun Mehta — Team presentation",            timestamp=ago(days=15)),
        AssetLog(org_id=tn.id, event="returned", asset_id=tn_assets[4].id, asset_name="Projector",     serial_number="TN-PJ-001", actor="Arjun Mehta",  detail="Returned by Arjun Mehta",                                timestamp=ago(days=8)),
        AssetLog(org_id=tn.id, event="assigned", asset_id=tn_assets[2].id, asset_name="Canon Camera",  serial_number="TN-CC-001", actor="Amit Sharma",  detail="Assigned to Sneha Patel — Product shoot for Q2 campaign", timestamp=ago(days=5)),
        AssetLog(org_id=tn.id, event="assigned", asset_id=tn_assets[6].id, asset_name="iPad Pro",      serial_number="TN-IP-001", actor="Amit Sharma",  detail="Assigned to Arjun Mehta — Mobile testing",               timestamp=ago(days=3)),
    ]
    db.session.add_all(tn_logs)

    # ══════════════════════════════════════════════════════════════════════
    # ORGANIZATION 2 — BrightBridge Corp
    # ══════════════════════════════════════════════════════════════════════
    bb = Organization(name="BrightBridge Corp", slug="brightbridge-corp")
    db.session.add(bb)
    db.session.flush()

    # Admin
    bb_admin = User(
        org_id=bb.id, role="admin",
        name="Neha Kapoor", email="admin@brightbridge.com",
        password_hash=pw("admin123"),
        department="Operations", job_title="Operations Manager", phone="+91 99200 11111",
    )
    # Employees
    bb_priya = User(
        org_id=bb.id, role="employee",
        name="Priya Singh", email="priya@brightbridge.com",
        password_hash=pw("password123"),
        department="Marketing", job_title="Marketing Executive", phone="+91 99200 22222",
    )
    bb_karan = User(
        org_id=bb.id, role="employee",
        name="Karan Joshi", email="karan@brightbridge.com",
        password_hash=pw("password123"),
        department="Sales", job_title="Sales Associate", phone="+91 99200 33333",
    )
    db.session.add_all([bb_admin, bb_priya, bb_karan])
    db.session.flush()

    # Assets — BrightBridge
    bb_assets = [
        Asset(org_id=bb.id, name="MacBook Pro",  serial_number="BB-MB-001", status="assigned"),
        Asset(org_id=bb.id, name="MacBook Pro",  serial_number="BB-MB-002", status="available"),
        Asset(org_id=bb.id, name="Projector",    serial_number="BB-PJ-001", status="available"),
        Asset(org_id=bb.id, name="Webcam HD",    serial_number="BB-WC-001", status="assigned"),
        Asset(org_id=bb.id, name="Webcam HD",    serial_number="BB-WC-002", status="retired"),
    ]
    db.session.add_all(bb_assets)
    db.session.flush()

    # Assignments — BrightBridge
    bb_a1 = Assignment(
        asset_id=bb_assets[0].id,
        assigned_to_user_id=bb_priya.id,
        assigned_by_user_id=bb_admin.id,
        assigned_at=ago(days=7),
        notes="Campaign content creation",
    )
    bb_a2 = Assignment(
        asset_id=bb_assets[3].id,
        assigned_to_user_id=bb_karan.id,
        assigned_by_user_id=bb_admin.id,
        assigned_at=ago(days=2),
        notes="Client video calls",
    )
    bb_a3_returned = Assignment(
        asset_id=bb_assets[1].id,           # MacBook Pro BB-MB-002 — returned
        assigned_to_user_id=bb_karan.id,
        assigned_by_user_id=bb_admin.id,
        assigned_at=ago(days=20),
        returned_at=ago(days=12),
        notes="Temporary loan during onboarding",
    )
    db.session.add_all([bb_a1, bb_a2, bb_a3_returned])

    # Asset logs — BrightBridge
    bb_logs = [
        AssetLog(org_id=bb.id, event="created", asset_id=bb_assets[0].id, asset_name="MacBook Pro", serial_number="BB-MB-001", actor="Neha Kapoor", detail="Initial status: available",   timestamp=ago(days=40)),
        AssetLog(org_id=bb.id, event="created", asset_id=bb_assets[1].id, asset_name="MacBook Pro", serial_number="BB-MB-002", actor="Neha Kapoor", detail="Initial status: available",   timestamp=ago(days=40)),
        AssetLog(org_id=bb.id, event="created", asset_id=bb_assets[2].id, asset_name="Projector",   serial_number="BB-PJ-001", actor="Neha Kapoor", detail="Initial status: available",   timestamp=ago(days=35)),
        AssetLog(org_id=bb.id, event="created", asset_id=bb_assets[3].id, asset_name="Webcam HD",   serial_number="BB-WC-001", actor="Neha Kapoor", detail="Initial status: available",   timestamp=ago(days=30)),
        AssetLog(org_id=bb.id, event="created", asset_id=bb_assets[4].id, asset_name="Webcam HD",   serial_number="BB-WC-002", actor="Neha Kapoor", detail="Initial status: retired",     timestamp=ago(days=30)),
        AssetLog(org_id=bb.id, event="assigned", asset_id=bb_assets[1].id, asset_name="MacBook Pro", serial_number="BB-MB-002", actor="Neha Kapoor", detail="Assigned to Karan Joshi — Temporary loan during onboarding", timestamp=ago(days=20)),
        AssetLog(org_id=bb.id, event="returned", asset_id=bb_assets[1].id, asset_name="MacBook Pro", serial_number="BB-MB-002", actor="Karan Joshi", detail="Returned by Karan Joshi",    timestamp=ago(days=12)),
        AssetLog(org_id=bb.id, event="assigned", asset_id=bb_assets[0].id, asset_name="MacBook Pro", serial_number="BB-MB-001", actor="Neha Kapoor", detail="Assigned to Priya Singh — Campaign content creation", timestamp=ago(days=7)),
        AssetLog(org_id=bb.id, event="assigned", asset_id=bb_assets[3].id, asset_name="Webcam HD",   serial_number="BB-WC-001", actor="Neha Kapoor", detail="Assigned to Karan Joshi — Client video calls",        timestamp=ago(days=2)),
    ]
    db.session.add_all(bb_logs)

    db.session.commit()

    # ── Summary ───────────────────────────────────────────────────────────
    print("\nSeed data inserted successfully!\n")
    print("=" * 52)
    print("  ORG 1 - TechNova Solutions")
    print("  Admin    : admin@technova.com     / admin123")
    print("  Employee : rahul@technova.com     / password123")
    print("  Employee : sneha@technova.com     / password123")
    print("  Employee : arjun@technova.com     / password123")
    print("  Assets   : 7  (2 assigned, 1 maintenance, 4 available)")
    print()
    print("  ORG 2 - BrightBridge Corp")
    print("  Admin    : admin@brightbridge.com / admin123")
    print("  Employee : priya@brightbridge.com / password123")
    print("  Employee : karan@brightbridge.com / password123")
    print("  Assets   : 5  (2 assigned, 1 retired, 2 available)")
    print("=" * 52)
