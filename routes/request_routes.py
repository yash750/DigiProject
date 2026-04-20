from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, get_jwt
from datetime import datetime, timezone
from extensions import db
from models.asset_request import AssetRequest
from models.asset import Asset
from models.user import User
from routes.decorators import login_required, current_org_id
from services.asset_service import assign_asset, transfer_asset

request_bp = Blueprint("request_bp", __name__, url_prefix="/requests")


def _me():
    return int(get_jwt_identity())

def _org():
    return current_org_id()

def _is_admin():
    return get_jwt().get("role") == "admin"


# ── Create a request ─────────────────────────────────────────────────────────

@request_bp.route("", methods=["POST"])
@login_required
def create_request():
    """
    Employee creates a request.
    Body:
      { asset_id: int }          → specific request (asset must be available, in org)
      { asset_name: str }        → global request (no specific asset)
      note: str (optional for both)
    """
    if _is_admin():
        return jsonify({"error": "Admins do not raise requests"}), 403

    data     = request.get_json(silent=True) or {}
    org_id   = _org()
    user_id  = _me()
    note     = (data.get("note") or "").strip() or None
    asset_id = data.get("asset_id")

    # ── Specific request ──
    if asset_id:
        asset = Asset.query.filter_by(id=int(asset_id), org_id=org_id).first()
        if not asset:
            return jsonify({"error": "Asset not found"}), 404
        if asset.status != Asset.STATUS_AVAILABLE:
            return jsonify({"error": "Asset is not available"}), 400

        # Block duplicate pending request for same asset by same user
        existing = AssetRequest.query.filter_by(
            org_id=org_id, requested_by_id=user_id,
            asset_id=int(asset_id), status=AssetRequest.STATUS_PENDING
        ).first()
        if existing:
            return jsonify({"error": "You already have a pending request for this asset"}), 400

        req = AssetRequest(
            org_id=org_id, requested_by_id=user_id,
            asset_id=int(asset_id), note=note,
        )

    # ── Global request ──
    else:
        asset_name = (data.get("asset_name") or "").strip()
        if not asset_name:
            return jsonify({"error": "Provide asset_id for a specific request or asset_name for a global one"}), 400

        req = AssetRequest(
            org_id=org_id, requested_by_id=user_id,
            asset_name=asset_name, note=note,
        )

    db.session.add(req)
    db.session.commit()
    return jsonify(req.to_dict()), 201


# ── List requests ─────────────────────────────────────────────────────────────

@request_bp.route("", methods=["GET"])
@login_required
def list_requests():
    """
    Admin  → all pending specific requests in the org (to action them).
    Employee → their own requests (all statuses).
    """
    org_id = _org()
    if _is_admin():
        reqs = (AssetRequest.query
                .filter_by(org_id=org_id, status=AssetRequest.STATUS_PENDING)
                .filter(AssetRequest.asset_id.isnot(None))   # specific only
                .order_by(AssetRequest.created_at.desc()).all())
    else:
        reqs = (AssetRequest.query
                .filter_by(org_id=org_id, requested_by_id=_me())
                .order_by(AssetRequest.created_at.desc()).all())
    return jsonify([r.to_dict() for r in reqs]), 200


@request_bp.route("/open", methods=["GET"])
@login_required
def open_global_requests():
    """All open global requests in the org — visible to every user."""
    reqs = (AssetRequest.query
            .filter_by(org_id=_org(), status=AssetRequest.STATUS_PENDING)
            .filter(AssetRequest.asset_id.is_(None))          # global only
            .order_by(AssetRequest.created_at.desc()).all())
    return jsonify([r.to_dict() for r in reqs]), 200


# ── Action a request ──────────────────────────────────────────────────────────

@request_bp.route("/<int:req_id>", methods=["PATCH"])
@login_required
def action_request(req_id):
    """
    Specific request (admin only):
      { action: "approve" }  → assign asset to requester, mark fulfilled
      { action: "reject"  }  → mark rejected

    Global request (any employee who holds the asset):
      { action: "fulfil", asset_id: int }  → transfer that asset to requester
    """
    org_id = _org()
    req    = AssetRequest.query.filter_by(id=req_id, org_id=org_id).first()
    if not req:
        return jsonify({"error": "Request not found"}), 404
    if req.status != AssetRequest.STATUS_PENDING:
        return jsonify({"error": f"Request is already {req.status}"}), 400

    data   = request.get_json(silent=True) or {}
    action = (data.get("action") or "").strip()

    # ── Specific request: admin approves / rejects ──
    if not req.is_global:
        if not _is_admin():
            return jsonify({"error": "Only admins can approve or reject specific requests"}), 403
        if action == "approve":
            asset = Asset.query.filter_by(id=req.asset_id, org_id=org_id).first()
            if not asset or asset.status != Asset.STATUS_AVAILABLE:
                return jsonify({"error": "Asset is no longer available"}), 400
            try:
                assign_asset(
                    asset_id=req.asset_id,
                    to_user_id=req.requested_by_id,
                    by_user_id=_me(),
                    org_id=org_id,
                    notes=f"Approved request #{req.id}",
                )
            except ValueError as e:
                return jsonify({"error": str(e)}), 400
            req.status        = AssetRequest.STATUS_FULFILLED
            req.resolved_by_id = _me()
        elif action == "reject":
            req.status         = AssetRequest.STATUS_REJECTED
            req.resolved_by_id = _me()
        else:
            return jsonify({"error": "action must be 'approve' or 'reject'"}), 400

    # ── Global request: any employee fulfils by transferring ──
    else:
        if action != "fulfil":
            return jsonify({"error": "action must be 'fulfil' for global requests"}), 400

        fulfil_asset_id = data.get("asset_id")
        if not fulfil_asset_id:
            return jsonify({"error": "asset_id is required to fulfil a global request"}), 400

        # Prevent requester from fulfilling their own request
        if _me() == req.requested_by_id:
            return jsonify({"error": "You cannot fulfil your own request"}), 400

        try:
            transfer_asset(
                asset_id=int(fulfil_asset_id),
                to_user_id=req.requested_by_id,
                transferred_by_id=_me(),
                org_id=org_id,
                notes=f"Fulfilled global request #{req.id} — {req.asset_name}",
            )
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

        req.status         = AssetRequest.STATUS_FULFILLED
        req.resolved_by_id = _me()

    req.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(req.to_dict()), 200


# ── Cancel own request ────────────────────────────────────────────────────────

@request_bp.route("/<int:req_id>", methods=["DELETE"])
@login_required
def cancel_request(req_id):
    org_id = _org()
    req    = AssetRequest.query.filter_by(id=req_id, org_id=org_id).first()
    if not req:
        return jsonify({"error": "Request not found"}), 404
    if req.requested_by_id != _me():
        return jsonify({"error": "You can only cancel your own requests"}), 403
    if req.status != AssetRequest.STATUS_PENDING:
        return jsonify({"error": f"Cannot cancel a request that is already {req.status}"}), 400

    req.status     = AssetRequest.STATUS_CANCELLED
    req.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"message": "Request cancelled"}), 200
