from datetime import datetime, timezone
from extensions import db
from models.asset import Asset
from models.assignment import Assignment
from models.asset_log import AssetLog


def _log(event, asset, org_id=None, actor=None, detail=None):
    db.session.add(AssetLog(
        org_id=org_id,
        event=event,
        asset_id=asset.id if asset.id else None,
        asset_name=asset.name,
        serial_number=asset.serial_number,
        actor=actor,
        detail=detail,
    ))


def create_asset(name, serial_number, org_id, status=None):
    name          = name.strip()
    serial_number = serial_number.strip()

    if not name or not serial_number:
        raise ValueError("Name and serial number are required")

    if Asset.query.filter_by(org_id=org_id, serial_number=serial_number).first():
        raise ValueError(f"Serial number '{serial_number}' already exists in your organization")

    asset = Asset(
        org_id=org_id,
        name=name,
        serial_number=serial_number,
        status=status or Asset.STATUS_AVAILABLE,
    )
    db.session.add(asset)
    db.session.flush()
    _log(AssetLog.EVENT_CREATED, asset, org_id=org_id, detail=f"Initial status: {asset.status}")
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return asset


def delete_asset(asset_id, org_id):
    asset = Asset.query.filter_by(id=asset_id, org_id=org_id).first()
    if not asset:
        raise ValueError("Asset not found")
    if asset.status == Asset.STATUS_ASSIGNED:
        raise ValueError("Cannot delete an asset that is currently assigned. Return it first.")

    log = AssetLog(
        org_id=org_id,
        event=AssetLog.EVENT_DELETED,
        asset_id=None,
        asset_name=asset.name,
        serial_number=asset.serial_number,
        detail="Asset permanently removed from inventory",
    )
    db.session.add(log)
    db.session.delete(asset)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise


def assign_asset(asset_id, to_user_id, by_user_id, org_id, notes=None):
    asset = (db.session.query(Asset)
             .filter_by(id=asset_id, org_id=org_id)
             .with_for_update().first())

    if not asset:
        raise ValueError("Asset not found")
    if asset.status != Asset.STATUS_AVAILABLE:
        raise ValueError("Asset is not available for assignment")

    from models.user import User
    to_user = User.query.filter_by(id=to_user_id, org_id=org_id).first()
    by_user = User.query.filter_by(id=by_user_id, org_id=org_id).first()

    if not to_user or not by_user:
        raise ValueError("User not found in your organization")

    assignment = Assignment(
        asset_id=asset.id,
        assigned_to_user_id=to_user_id,
        assigned_by_user_id=by_user_id,
        assigned_at=datetime.now(timezone.utc),
        notes=notes,
    )
    asset.status = Asset.STATUS_ASSIGNED
    db.session.add(assignment)

    _log(
        AssetLog.EVENT_ASSIGNED, asset, org_id=org_id,
        actor=by_user.name,
        detail=f"Assigned to {to_user.name}" + (f" — {notes}" if notes else ""),
    )
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return assignment


def return_asset(asset_id, org_id):
    asset = Asset.query.filter_by(id=asset_id, org_id=org_id).first()
    if not asset:
        raise ValueError("Asset not found")

    active = asset.assignments.filter_by(returned_at=None).first()
    if not active:
        raise ValueError("Asset is not currently assigned")

    holder_name = active.assigned_to_user.name if active.assigned_to_user else "unknown"
    active.returned_at = datetime.now(timezone.utc)
    asset.status = Asset.STATUS_AVAILABLE

    _log(AssetLog.EVENT_RETURNED, asset, org_id=org_id,
         actor=holder_name, detail=f"Returned by {holder_name}")

    db.session.commit()
    return active
