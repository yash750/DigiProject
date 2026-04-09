from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash
from services.asset_service import assign_asset, return_asset, create_asset, delete_asset
from models.asset import Asset
from models.user import User
from models.assignment import Assignment
from models.asset_log import AssetLog
from routes.decorators import admin_required, login_required
asset_bp = Blueprint("asset_bp", __name__)


#API ROUTES
@asset_bp.route("/asset/<int:asset_id>/history")
def asset_history(asset_id):
    asset = Asset.query.get_or_404(asset_id)
    history = (
        Assignment.query
        .filter_by(asset_id=asset_id)
        .order_by(Assignment.assigned_at.desc())
        .all()
    )
    return render_template("history.html", asset=asset, history=history)


@asset_bp.route("/asset/<int:asset_id>/history/json")
def asset_history_json(asset_id):
    """Full lifecycle timeline for one asset, consumed by the React frontend."""
    asset = Asset.query.get_or_404(asset_id)

    # Assignment records (assign + return pairs)
    assignments = (
        Assignment.query
        .filter_by(asset_id=asset_id)
        .order_by(Assignment.assigned_at.desc())
        .all()
    )

    # Audit log entries for this asset
    logs = (
        AssetLog.query
        .filter_by(asset_id=asset_id)
        .order_by(AssetLog.timestamp.desc())
        .all()
    )

    # Build a unified timeline: one entry per assignment (covers assign + return),
    # plus created/deleted log entries that have no assignment row.
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
        if l.event in (AssetLog.EVENT_CREATED, AssetLog.EVENT_DELETED)
    ]

    # Merge and sort newest-first
    timeline = sorted(
        assignment_events + log_events,
        key=lambda x: x["timestamp"] or "",
        reverse=True,
    )

    return jsonify({
        "asset":    {"id": asset.id, "name": asset.name, "serial_number": asset.serial_number, "status": asset.status},
        "timeline": timeline,
    })


@asset_bp.route("/activity/json")
def global_activity_json():
    """Global activity feed — every event across all assets, newest first."""
    logs = (
        AssetLog.query
        .order_by(AssetLog.timestamp.desc())
        .limit(200)
        .all()
    )
    return jsonify([l.to_dict() for l in logs])

@asset_bp.route("/assets", methods=["GET", "POST"])
def assets_api():
    from flask_jwt_extended import verify_jwt_in_request, get_jwt
    # POST requires admin; GET is public for authenticated users
    if request.method == "POST":
        verify_jwt_in_request()
        if get_jwt().get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
    if request.method == "GET":
        assets = Asset.query.all()
        return jsonify([a.to_dict() for a in assets])

    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid or missing JSON body"}), 400
    if not data.get("name") or not data.get("serial_number"):
        return jsonify({"error": "name and serial_number are required"}), 400
    try:
        asset = create_asset(
            name=data["name"],
            serial_number=data["serial_number"],
            status=data.get("status"),
        )
        return jsonify(asset.to_dict()), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "Internal Server Error"}), 500


@asset_bp.route("/assets/<int:asset_id>", methods=["DELETE"])
@admin_required
def delete_asset_api(asset_id):
    try:
        delete_asset(asset_id)
        return jsonify({"message": "Asset deleted"}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "Internal Server Error"}), 500


@asset_bp.route("/users", methods=["GET"])
def list_users():
    users = User.query.all()
    return jsonify([{"id": u.id, "name": u.name} for u in users])


@asset_bp.route("/assign", methods=["POST"])
@login_required
def assign_api():
    data = request.get_json()

    if not data:
        return jsonify({"error": "Invalid or missing JSON body"}), 400

    required = ["asset_id", "to_user_id", "by_user_id"]
    if not all(k in data for k in required):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        assign_asset(
            data["asset_id"],
            data["to_user_id"],
            data["by_user_id"],
            notes=data.get("notes")
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
        return_asset(asset_id)
        return jsonify({"message": "Returned successfully"}), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    except Exception:
        return jsonify({"error": "Internal Server Error"}), 500


# UI ROUTES

@asset_bp.route("/")
def dashboard_page():
    assets = Asset.query.all()
    inventory_summary = {}

    for asset in assets:
        name = asset.name
        if name not in inventory_summary:
            inventory_summary[name] = {"total": 0, "available": 0}
        inventory_summary[name]["total"] += 1
        if asset.status == "available":
            inventory_summary[name]["available"] += 1
     
    return render_template("dashboard.html", assets=assets, summary=inventory_summary)


@asset_bp.route("/assign-page")
def assign_page():
    assets = Asset.query.all()
    users = User.query.all()
    return render_template("assign.html", assets=assets, users=users)


@asset_bp.route("/assign-form", methods=["POST"])
def assign_form():
    try:
        assign_asset(
            request.form["asset_id"],
            request.form["to_user_id"],
            request.form["by_user_id"]
        )
        flash("Asset assigned successfully!", "success")

    except ValueError as e:
        flash(str(e), "error")

    except Exception:
        flash("Unexpected error occurred", "error")

    return redirect(url_for("asset_bp.dashboard_page"))


@asset_bp.route("/return-form/<int:asset_id>", methods=["POST"])
def return_form(asset_id):
    try:
        return_asset(asset_id)
        flash("Asset returned successfully!", "success")

    except ValueError as e:
        flash(str(e), "error")

    except Exception:
        flash("Unexpected error occurred", "error")

    return redirect(url_for("asset_bp.dashboard_page"))
