from extensions import db
from datetime import datetime, timezone


class AssetRequest(db.Model):
    """
    An employee's request for an asset.

    Two types:
      - Specific  : asset_id is set   → visible to admin; admin approves/rejects
      - Global    : asset_id is None  → visible to all users; any holder can fulfil by transferring
    """
    __tablename__ = "asset_requests"

    STATUS_PENDING   = "pending"
    STATUS_APPROVED  = "approved"
    STATUS_REJECTED  = "rejected"
    STATUS_FULFILLED = "fulfilled"
    STATUS_CANCELLED = "cancelled"

    id               = db.Column(db.Integer, primary_key=True)
    org_id           = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=False, index=True)
    requested_by_id  = db.Column(db.Integer, db.ForeignKey("users.id"),         nullable=False, index=True)

    # Specific request — points to an available asset
    asset_id         = db.Column(db.Integer, db.ForeignKey("assets.id"),        nullable=True)

    # Global request — employee describes what they need (no specific asset)
    asset_name       = db.Column(db.String(100), nullable=True)

    note             = db.Column(db.String(255), nullable=True)
    status           = db.Column(db.String(20),  nullable=False, default=STATUS_PENDING)
    resolved_by_id   = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at       = db.Column(db.DateTime(timezone=True),
                                 default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at       = db.Column(db.DateTime(timezone=True),
                                 default=lambda: datetime.now(timezone.utc),
                                 onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    requested_by  = db.relationship("User", foreign_keys=[requested_by_id],  backref="asset_requests_made")
    asset         = db.relationship("Asset", foreign_keys=[asset_id],         backref="requests")
    resolved_by   = db.relationship("User", foreign_keys=[resolved_by_id],    backref="asset_requests_resolved")

    @property
    def is_global(self):
        return self.asset_id is None

    def to_dict(self):
        return {
            "id":               self.id,
            "org_id":           self.org_id,
            "type":             "global" if self.is_global else "specific",
            "requested_by":     self.requested_by.name  if self.requested_by else None,
            "requested_by_id":  self.requested_by_id,
            "asset_id":         self.asset_id,
            "asset_name":       (self.asset.name if self.asset else None) or self.asset_name,
            "asset_serial":     self.asset.serial_number if self.asset else None,
            "note":             self.note,
            "status":           self.status,
            "resolved_by":      self.resolved_by.name if self.resolved_by else None,
            "created_at":       self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<AssetRequest {self.status} by {self.requested_by_id}>"
