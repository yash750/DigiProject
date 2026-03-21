from extensions import db
from datetime import datetime, timezone


class AssetLog(db.Model):
    """Append-only audit log for every asset lifecycle event."""
    __tablename__ = "asset_logs"

    EVENT_CREATED    = "created"
    EVENT_DELETED    = "deleted"
    EVENT_ASSIGNED   = "assigned"
    EVENT_RETURNED   = "returned"

    id            = db.Column(db.Integer, primary_key=True)
    event         = db.Column(db.String(20), nullable=False)          # created / deleted / assigned / returned
    asset_id      = db.Column(db.Integer, nullable=True)              # nullable — asset may be deleted later
    asset_name    = db.Column(db.String(50), nullable=False)          # snapshot so history survives deletion
    serial_number = db.Column(db.String(50), nullable=False)
    actor         = db.Column(db.String(100), nullable=True)          # user name who triggered the event
    detail        = db.Column(db.String(255), nullable=True)          # extra human-readable context
    timestamp     = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            "id":            self.id,
            "event":         self.event,
            "asset_id":      self.asset_id,
            "asset_name":    self.asset_name,
            "serial_number": self.serial_number,
            "actor":         self.actor,
            "detail":        self.detail,
            "timestamp":     self.timestamp.isoformat() if self.timestamp else None,
        }

    def __repr__(self):
        return f"<AssetLog {self.event} | {self.asset_name}>"
