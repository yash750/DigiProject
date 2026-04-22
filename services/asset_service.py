from datetime import datetime, timezone
from extensions import db
from models.asset import Asset
from models.assignment import Assignment
from models.asset_log import AssetLog


def _log(event, asset, org_id=None, actor=None, detail=None):
    db.session.add(
        AssetLog(
            org_id=org_id,
            event=event,
            asset_id=asset.id if asset.id else None,
            asset_name=asset.name,
            serial_number=asset.serial_number,
            actor=actor,
            detail=detail,
        )
    )


def create_asset(name, serial_number, org_id, status=None):
    name = name.strip()
    serial_number = serial_number.strip()

    if not name or not serial_number:
        raise ValueError("Name and serial number are required")

    if Asset.query.filter_by(org_id=org_id, serial_number=serial_number).first():
        raise ValueError(
            f"Serial number '{serial_number}' already exists in your organization"
        )

    asset = Asset(
        org_id=org_id,
        name=name,
        serial_number=serial_number,
        status=status or Asset.STATUS_AVAILABLE,
    )
    db.session.add(asset)
    db.session.flush()
    _log(
        AssetLog.EVENT_CREATED,
        asset,
        org_id=org_id,
        detail=f"Initial status: {asset.status}",
    )
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return asset


def bulk_add_units(name, count, org_id, base_serial=None):
    """Create `count` new assets of the same name with auto-generated serial numbers."""
    name = name.strip()
    if not name:
        raise ValueError("Name is required")
    if count < 1 or count > 50:
        raise ValueError("Count must be between 1 and 50")

    # Find highest existing serial suffix for this name to avoid collisions
    existing = Asset.query.filter_by(org_id=org_id, name=name).all()
    prefix = base_serial or name[:6].upper().replace(" ", "-")
    existing_serials = {
        a.serial_number for a in Asset.query.filter_by(org_id=org_id).all()
    }

    created = []
    n = len(existing) + 1
    for _ in range(count):
        # Find a free serial
        while True:
            serial = f"{prefix}-{n:03d}"
            if serial not in existing_serials:
                break
            n += 1
        asset = Asset(
            org_id=org_id,
            name=name,
            serial_number=serial,
            status=Asset.STATUS_AVAILABLE,
        )
        db.session.add(asset)
        db.session.flush()
        _log(
            AssetLog.EVENT_CREATED,
            asset,
            org_id=org_id,
            detail=f"Bulk added ({count} units batch)",
        )
        existing_serials.add(serial)
        created.append(asset)
        n += 1
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return created


def update_asset(
    asset_id, org_id, actor=None, name=None, serial_number=None, status=None
):
    asset = Asset.query.filter_by(id=asset_id, org_id=org_id).first()
    if not asset:
        raise ValueError("Asset not found")

    changes = []
    if name is not None:
        name = name.strip()
        if not name:
            raise ValueError("Name cannot be empty")
        if name != asset.name:
            changes.append(f"name: {asset.name} → {name}")
            asset.name = name

    if serial_number is not None:
        serial_number = serial_number.strip()
        if not serial_number:
            raise ValueError("Serial number cannot be empty")
        if serial_number != asset.serial_number:
            existing = Asset.query.filter_by(
                org_id=org_id, serial_number=serial_number
            ).first()
            if existing and existing.id != asset_id:
                raise ValueError(f"Serial number '{serial_number}' already exists")
            changes.append(f"serial: {asset.serial_number} → {serial_number}")
            asset.serial_number = serial_number

    if status is not None:
        allowed = {
            Asset.STATUS_AVAILABLE,
            Asset.STATUS_MAINTENANCE,
            Asset.STATUS_RETIRED,
        }
        if status not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        if asset.status == Asset.STATUS_ASSIGNED:
            raise ValueError(
                "Cannot change status of an assigned asset. Return it first."
            )
        if status != asset.status:
            changes.append(f"status: {asset.status} → {status}")
            asset.status = status

    if not changes:
        return asset

    _log(
        AssetLog.EVENT_UPDATED,
        asset,
        org_id=org_id,
        actor=actor,
        detail="; ".join(changes),
    )
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
        raise ValueError(
            "Cannot delete an asset that is currently assigned. Return it first."
        )

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
    asset = (
        db.session.query(Asset)
        .filter_by(id=asset_id, org_id=org_id)
        .with_for_update()
        .first()
    )

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
        AssetLog.EVENT_ASSIGNED,
        asset,
        org_id=org_id,
        actor=by_user.name,
        detail=f"Assigned to {to_user.name}" + (f" — {notes}" if notes else ""),
    )
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return assignment


def transfer_asset(asset_id, to_user_id, transferred_by_id, org_id, notes=None):
    """Close the current assignment and immediately open a new one for to_user_id."""
    from models.user import User

    now = datetime.now(timezone.utc)

    asset = (
        db.session.query(Asset)
        .filter_by(id=asset_id, org_id=org_id)
        .with_for_update()
        .first()
    )
    if not asset:
        raise ValueError("Asset not found")
    if asset.status != Asset.STATUS_ASSIGNED:
        raise ValueError("Asset is not currently assigned")

    active = asset.assignments.filter_by(returned_at=None).first()
    if not active:
        raise ValueError("No active assignment found")

    # Verify the caller is the current holder
    if active.assigned_to_user_id != transferred_by_id:
        raise ValueError("You can only transfer assets currently assigned to you")

    to_user = User.query.filter_by(id=to_user_id, org_id=org_id).first()
    from_user = User.query.filter_by(id=transferred_by_id, org_id=org_id).first()
    if not to_user:
        raise ValueError("Recipient not found in your organization")
    if to_user_id == transferred_by_id:
        raise ValueError("You cannot transfer an asset to yourself")

    # Close current assignment
    active.returned_at = now
    _log(
        AssetLog.EVENT_RETURNED,
        asset,
        org_id=org_id,
        actor=from_user.name,
        detail=f"Transferred to {to_user.name}" + (f" — {notes}" if notes else ""),
    )

    # Open new assignment
    new_assignment = Assignment(
        asset_id=asset.id,
        assigned_to_user_id=to_user_id,
        assigned_by_user_id=transferred_by_id,
        assigned_at=now,
        notes=notes,
    )
    db.session.add(new_assignment)
    _log(
        AssetLog.EVENT_ASSIGNED,
        asset,
        org_id=org_id,
        actor=from_user.name,
        detail=f"Transferred from {from_user.name} to {to_user.name}"
        + (f" — {notes}" if notes else ""),
    )

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return new_assignment


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

    _log(
        AssetLog.EVENT_RETURNED,
        asset,
        org_id=org_id,
        actor=holder_name,
        detail=f"Returned by {holder_name}",
    )

    db.session.commit()
    return active
