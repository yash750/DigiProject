from extensions import db
from datetime import datetime, timezone

class Assignment(db.Model):
    __tablename__ = "assignments"

    __table_args__ = (
        db.Index("idx_asset_active", "asset_id", "returned_at"),
    )

    id = db.Column(db.Integer, primary_key=True)

    asset_id = db.Column(db.Integer, db.ForeignKey("assets.id"), nullable=False, index=True)
    assigned_to_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    assigned_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    assigned_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    returned_at = db.Column(db.DateTime, nullable=True)
    notes = db.Column(db.String(255))
    assigned_to_user = db.relationship(
        "User",
        foreign_keys=[assigned_to_user_id],
        backref="assignments_received"
    )

    assigned_by_user = db.relationship(
        "User",
        foreign_keys=[assigned_by_user_id],
        backref="assignments_given"
    )

    def __repr__(self):
        return f"<Assignment Asset:{self.asset_id} To:{self.assigned_to_user_id}>"
