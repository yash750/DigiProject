from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash
from services.asset_service import assign_asset, return_asset
from models.asset import Asset
from models.user import User
from models.assignment import Assignment
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

@asset_bp.route("/assets", methods=["GET"])
def list_assets():
    assets = Asset.query.all()
    return jsonify([a.to_dict() for a in assets])


@asset_bp.route("/users", methods=["GET"])
def list_users():
    users = User.query.all()
    return jsonify([{"id": u.id, "name": u.name} for u in users])


@asset_bp.route("/assign", methods=["POST"])
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
