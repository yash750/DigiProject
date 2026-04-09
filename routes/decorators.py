from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt, verify_jwt_in_request


def admin_required(fn):
    """Route decorator: requires a valid JWT with role == 'admin'."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


def login_required(fn):
    """Route decorator: requires any valid JWT (admin or employee)."""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs)
    return wrapper
