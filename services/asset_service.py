from datetime import datetime, timezone
from extensions import db
from models.asset import Asset
from models.assignment import Assignment
from models.asset_log import AssetLog


def _log(event, asset, actor=None, detail=None):
    db.session.add(AssetLog(
        event=event,
        asset_id=asset.id if asset.id else None,
        asset_name=asset.name,
        serial_number=asset.serial_number,
        actor=actor,
        detail=detail,
    ))


def create_asset(name, serial_number, status=None):
    name          = name.strip()
    serial_number = serial_number.strip()

    if not name or not serial_number:
        raise ValueError("Name and serial number are required")

    if Asset.query.filter_by(serial_number=serial_number).first():
        raise ValueError(f"Serial number '{serial_number}' already exists")

    asset = Asset(
        name=name,
        serial_number=serial_number,
        status=status or Asset.STATUS_AVAILABLE,
    )
    db.session.add(asset)
    db.session.flush()   # get asset.id before commit
    _log(AssetLog.EVENT_CREATED, asset, detail=f"Initial status: {asset.status}")
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return asset


def delete_asset(asset_id):
    asset = Asset.query.get(asset_id)
    if not asset:
        raise ValueError("Asset not found")
    if asset.status == Asset.STATUS_ASSIGNED:
        raise ValueError("Cannot delete an asset that is currently assigned. Return it first.")

    # Write the log entry BEFORE deleting (cascade will wipe the asset row)
    log = AssetLog(
        event=AssetLog.EVENT_DELETED,
        asset_id=None,           # will be gone after commit
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


def assign_asset(asset_id, to_user_id, by_user_id, notes=None):
    asset = db.session.query(Asset).filter_by(id=asset_id).with_for_update().first()

    if not asset:
        raise ValueError("Asset not found")
    if asset.status != Asset.STATUS_AVAILABLE:
        raise ValueError("Asset is already assigned")

    from models.user import User
    to_user = User.query.get(to_user_id)
    by_user = User.query.get(by_user_id)

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
        AssetLog.EVENT_ASSIGNED,
        asset,
        actor=by_user.name if by_user else str(by_user_id),
        detail=f"Assigned to {to_user.name if to_user else to_user_id}" + (f" — {notes}" if notes else ""),
    )

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return assignment


def return_asset(asset_id):
    asset = Asset.query.get(asset_id)
    if not asset:
        raise Exception("Asset not found")

    active_assignment = asset.assignments.filter_by(returned_at=None).first()
    if not active_assignment:
        raise Exception("Asset is not currently assigned")

    holder_name = active_assignment.assigned_to_user.name if active_assignment.assigned_to_user else "unknown"

    active_assignment.returned_at = datetime.now(timezone.utc)
    asset.status = Asset.STATUS_AVAILABLE

    _log(
        AssetLog.EVENT_RETURNED,
        asset,
        actor=holder_name,
        detail=f"Returned by {holder_name}",
    )

    db.session.commit()
    return active_assignment
