from flask import Blueprint, request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity
from services.asset_service import assign_asset, return_asset, transfer_asset, create_asset, delete_asset, update_asset, bulk_add_units
from models.asset import Asset
from models.user import User
from models.assignment import Assignment
from models.asset_log import AssetLog
from routes.decorators import admin_required, login_required, current_org_id

asset_bp = Blueprint("asset_bp", __name__)


def _org():
    """Return org_id of the current JWT user."""
    return current_org_id()


# ── Asset CRUD ───────────────────────────────────────────────────────────────

@asset_bp.route("/assets", methods=["GET", "POST"])
def assets_api():
    verify_jwt_in_request()
    org_id = _org()

    if request.method == "GET":
        assets = Asset.query.filter_by(org_id=org_id).all()
        return jsonify([a.to_dict() for a in assets])

    # POST — admin only
    if get_jwt().get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    if not data or not data.get("name") or not data.get("serial_number"):
        return jsonify({"error": "name and serial_number are required"}), 400
    try:
        asset = create_asset(
            name=data["name"],
            serial_number=data["serial_number"],
            org_id=org_id,
            status=data.get("status"),
        )
        return jsonify(asset.to_dict()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "Internal Server Error"}), 500


@asset_bp.route("/assets/bulk", methods=["POST"])
@admin_required
def bulk_add_api():
    data = request.get_json() or {}
    name  = data.get("name", "").strip()
    count = data.get("count", 1)
    if not name:
        return jsonify({"error": "name is required"}), 400
    try:
        assets = bulk_add_units(name, int(count), org_id=_org(),
                                base_serial=data.get("base_serial"))
        return jsonify([a.to_dict() for a in assets]), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "Internal Server Error"}), 500


@asset_bp.route("/assets/<int:asset_id>", methods=["DELETE", "PATCH"])
@admin_required
def asset_detail_api(asset_id):
    if request.method == "DELETE":
        try:
            delete_asset(asset_id, org_id=_org())
            return jsonify({"message": "Asset deleted"}), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception:
            return jsonify({"error": "Internal Server Error"}), 500

    # PATCH
    data = request.get_json() or {}
    try:
        from flask_jwt_extended import get_jwt_identity
        from models.user import User
        actor_id = int(get_jwt_identity())
        actor = User.query.get(actor_id)
        asset = update_asset(
            asset_id, org_id=_org(),
            actor=actor.name if actor else None,
            name=data.get("name"),
            serial_number=data.get("serial_number"),
            status=data.get("status"),
        )
        return jsonify(asset.to_dict()), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "Internal Server Error"}), 500


# ── Users list (for dropdowns) ───────────────────────────────────────────────

@asset_bp.route("/users", methods=["GET"])
@login_required
def list_users():
    org_id = _org()
    users  = User.query.filter_by(org_id=org_id).all()
    return jsonify([{"id": u.id, "name": u.name} for u in users])


# ── Assign / Return / Transfer ───────────────────────────────────────────────

@asset_bp.route("/assign", methods=["POST"])
@admin_required
def assign_api():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid or missing JSON body"}), 400
    if not all(k in data for k in ["asset_id", "to_user_id"]):
        return jsonify({"error": "Missing required fields"}), 400
    try:
        assign_asset(
            data["asset_id"], data["to_user_id"],
            by_user_id=int(get_jwt_identity()),   # always the logged-in admin
            org_id=_org(), notes=data.get("notes"),
        )
        return jsonify({"message": "Assigned successfully"}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "Internal Server Error"}), 500


@asset_bp.route("/return/<int:asset_id>", methods=["POST"])
@login_required
def return_asset_api(asset_id):
    try:
        return_asset(asset_id, org_id=_org())
        return jsonify({"message": "Returned successfully"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "Internal Server Error"}), 500


@asset_bp.route("/transfer/<int:asset_id>", methods=["POST"])
@login_required
def transfer_asset_api(asset_id):
    """Employee transfers an asset they currently hold to another user."""
    data = request.get_json()
    if not data or not data.get("to_user_id"):
        return jsonify({"error": "to_user_id is required"}), 400
    try:
        transfer_asset(
            asset_id=asset_id,
            to_user_id=int(data["to_user_id"]),
            transferred_by_id=int(get_jwt_identity()),
            org_id=_org(),
            notes=data.get("notes"),
        )
        return jsonify({"message": "Asset transferred successfully"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "Internal Server Error"}), 500


# ── History ──────────────────────────────────────────────────────────────────

@asset_bp.route("/asset/<int:asset_id>/history/json")
@login_required
def asset_history_json(asset_id):
    org_id = _org()
    asset  = Asset.query.filter_by(id=asset_id, org_id=org_id).first_or_404()

    assignments = (Assignment.query
                   .filter_by(asset_id=asset_id)
                   .order_by(Assignment.assigned_at.desc()).all())

    logs = (AssetLog.query
            .filter_by(asset_id=asset_id, org_id=org_id)
            .order_by(AssetLog.timestamp.desc()).all())

    assignment_events = [
        {
            "type":        "assignment",
            "assigned_to": h.assigned_to_user.name,
            "assigned_by": h.assigned_by_user.name,
            "assigned_at": h.assigned_at.isoformat() if h.assigned_at else None,
            "returned_at": h.returned_at.isoformat() if h.returned_at else None,
            "notes":       h.notes,
            "timestamp":   h.assigned_at.isoformat() if h.assigned_at else None,
        }
        for h in assignments
    ]

    log_events = [
        {
            "type":      "log",
            "event":     l.event,
            "actor":     l.actor,
            "detail":    l.detail,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None,
        }
        for l in logs
        if l.event in (AssetLog.EVENT_CREATED, AssetLog.EVENT_DELETED, AssetLog.EVENT_UPDATED)
    ]

    timeline = sorted(
        assignment_events + log_events,
        key=lambda x: x["timestamp"] or "",
        reverse=True,
    )

    return jsonify({
        "asset":    {"id": asset.id, "name": asset.name,
                     "serial_number": asset.serial_number, "status": asset.status},
        "timeline": timeline,
    })


@asset_bp.route("/activity/json")
@login_required
def global_activity_json():
    org_id = _org()
    logs   = (AssetLog.query
              .filter_by(org_id=org_id)
              .order_by(AssetLog.timestamp.desc())
              .limit(200).all())
    return jsonify([l.to_dict() for l in logs])
