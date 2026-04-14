from extensions import db

class Asset(db.Model):
    __tablename__ = "assets"

    STATUS_AVAILABLE   = "available"
    STATUS_ASSIGNED    = "assigned"
    STATUS_MAINTENANCE = "maintenance"
    STATUS_RETIRED     = "retired"

    __table_args__ = (
        db.UniqueConstraint("org_id", "serial_number", name="uq_org_serial"),
    )

    id            = db.Column(db.Integer, primary_key=True)
    org_id        = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=True, index=True)
    name          = db.Column(db.String(50),  nullable=False)
    serial_number = db.Column(db.String(50),  nullable=False)
    status        = db.Column(db.String(50),  default=STATUS_AVAILABLE, nullable=False)

    assignments = db.relationship(
        "Assignment",
        backref="asset",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    @property
    def current_holder(self):
        active = self.assignments.filter_by(returned_at=None).first()
        return active.assigned_to_user if active else None

    def to_dict(self):
        return {
            "id":             self.id,
            "org_id":         self.org_id,
            "name":           self.name,
            "serial_number":  self.serial_number,
            "status":         self.status,
            "current_holder": self.current_holder.name if self.current_holder else None,
        }

    def __repr__(self):
        return f"<Asset {self.name} | {self.status}>"
