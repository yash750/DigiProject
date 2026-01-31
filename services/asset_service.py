from datetime import datetime, timezone
from extensions import db
from models.asset import Asset
from models.assignment import Assignment

def assign_asset(asset_id, to_user_id, by_user_id, notes=None):
    asset = db.session.query(Asset).filter_by(id=asset_id).with_for_update().first()

    if not asset:
        raise ValueError("Asset not found")

    if asset.status != Asset.STATUS_AVAILABLE:
        raise ValueError("Asset is already assigned")

    assignment = Assignment(
        asset_id=asset.id,
        assigned_to_user_id=to_user_id,
        assigned_by_user_id=by_user_id,
        assigned_at=datetime.now(timezone.utc),
        notes=notes
    )

    asset.status = Asset.STATUS_ASSIGNED
    db.session.add(assignment)

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

    active_assignment.returned_at = datetime.now(timezone.utc)
    asset.status = Asset.STATUS_AVAILABLE

    db.session.commit()

    return active_assignment
