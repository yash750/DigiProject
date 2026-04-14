from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt,
)
from extensions import bcrypt, db
from models.user import User
from models.organization import Organization
from routes.decorators import admin_required, login_required, current_org_id
import re

auth_bp = Blueprint("auth_bp", __name__, url_prefix="/auth")

_blocklist = set()


def _slug(name):
    """Turn an org name into a url-safe slug, e.g. 'Acme Corp' → 'acme-corp'."""
    s = re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-")
    # ensure uniqueness by appending a counter if needed
    base, n = s, 1
    while Organization.query.filter_by(slug=s).first():
        s = f"{base}-{n}"; n += 1
    return s


# ── Register (public) ────────────────────────────────────────────────────────

@auth_bp.route("/register", methods=["POST"])
def register():
    """Create a new organization + admin account in one step."""
    data     = request.get_json(silent=True) or {}
    org_name = (data.get("org_name") or "").strip()
    name     = (data.get("name")     or "").strip()
    email    = (data.get("email")    or "").strip().lower()
    password = data.get("password")  or ""

    if not org_name or not name or not email or not password:
        return jsonify({"error": "org_name, name, email and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": f"Email '{email}' is already registered"}), 400

    org  = Organization(name=org_name, slug=_slug(org_name))
    db.session.add(org)
    db.session.flush()   # get org.id

    admin = User(
        org_id=org.id,
        name=name,
        email=email,
        password_hash=bcrypt.generate_password_hash(password).decode("utf-8"),
        role="admin",
    )
    db.session.add(admin)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    access_token  = create_access_token(str(admin.id), additional_claims={"role": "admin"})
    refresh_token = create_refresh_token(str(admin.id))
    return jsonify({
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "user":          admin.to_dict(),
        "organization":  org.to_dict(),
    }), 201


# ── Login ────────────────────────────────────────────────────────────────────

@auth_bp.route("/login", methods=["POST"])
def login():
    data     = request.get_json(silent=True) or {}
    email    = (data.get("email")    or "").strip().lower()
    password = data.get("password")  or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.password_hash:
        return jsonify({"error": "Invalid credentials"}), 401
    if not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401

    access_token  = create_access_token(str(user.id), additional_claims={"role": user.role})
    refresh_token = create_refresh_token(str(user.id))
    return jsonify({
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "user":          user.to_dict(),
        "organization":  user.organization.to_dict() if user.organization else None,
    }), 200


# ── Refresh / Logout / Me ────────────────────────────────────────────────────

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "User not found"}), 404
    token = create_access_token(str(user.id), additional_claims={"role": user.role})
    return jsonify({"access_token": token}), 200


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    _blocklist.add(get_jwt()["jti"])
    return jsonify({"message": "Logged out successfully"}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.to_dict()), 200


def get_blocklist():
    return _blocklist


# ── Employee management (admin only, org-scoped) ─────────────────────────────

@auth_bp.route("/users", methods=["GET"])
@admin_required
def list_all_users():
    org_id = current_org_id()
    users  = User.query.filter_by(org_id=org_id).order_by(User.name).all()
    return jsonify([u.to_dict() for u in users]), 200


@auth_bp.route("/users", methods=["POST"])
@admin_required
def create_user():
    org_id   = current_org_id()
    data     = request.get_json(silent=True) or {}
    name     = (data.get("name")     or "").strip()
    email    = (data.get("email")    or "").strip().lower()
    password = data.get("password")  or ""

    if not name or not email or not password:
        return jsonify({"error": "name, email and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": f"Email '{email}' is already registered"}), 400

    user = User(
        org_id=org_id,
        name=name,
        email=email,
        password_hash=bcrypt.generate_password_hash(password).decode("utf-8"),
        role="employee",
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@auth_bp.route("/users/<int:user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    org_id     = current_org_id()
    current_id = int(get_jwt_identity())

    if user_id == current_id:
        return jsonify({"error": "You cannot delete your own account"}), 400

    user = User.query.filter_by(id=user_id, org_id=org_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    if user.role == "admin":
        return jsonify({"error": "Cannot delete an admin account"}), 400

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": f"User '{user.name}' deleted"}), 200


# ── Profile (any authenticated user) ─────────────────────────────────────────

@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "User not found"}), 404
    org = user.organization
    return jsonify({**user.to_dict(), "organization": org.to_dict() if org else None}), 200


@auth_bp.route("/profile", methods=["PATCH"])
@jwt_required()
def update_profile():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}

    if "name" in data and data["name"].strip():
        user.name = data["name"].strip()
    if "phone" in data:
        user.phone = (data["phone"] or "").strip() or None
    if "department" in data:
        user.department = (data["department"] or "").strip() or None
    if "job_title" in data:
        user.job_title = (data["job_title"] or "").strip() or None

    # Password change (optional)
    if data.get("new_password"):
        if not data.get("current_password"):
            return jsonify({"error": "current_password is required to set a new password"}), 400
        if not bcrypt.check_password_hash(user.password_hash, data["current_password"]):
            return jsonify({"error": "Current password is incorrect"}), 400
        if len(data["new_password"]) < 6:
            return jsonify({"error": "New password must be at least 6 characters"}), 400
        user.password_hash = bcrypt.generate_password_hash(data["new_password"]).decode("utf-8")

    db.session.commit()
    org = user.organization
    return jsonify({**user.to_dict(), "organization": org.to_dict() if org else None}), 200
