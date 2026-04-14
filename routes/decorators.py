from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity, verify_jwt_in_request
from models.user import User


def _current_user():
    return User.query.get(int(get_jwt_identity()))


def current_org_id():
    """Return the org_id of the authenticated user. Call inside a JWT-protected context."""
    u = _current_user()
    return u.org_id if u else None


def admin_required(fn):
    """Requires a valid JWT with role == 'admin'."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        if get_jwt().get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


def login_required(fn):
    """Requires any valid JWT (admin or employee)."""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs)
    return wrapper
