from extensions import db

class Asset(db.Model):
    __tablename__ = "assets"

    STATUS_AVAILABLE = "available"
    STATUS_ASSIGNED = "assigned"
    STATUS_MAINTENANCE = "maintenance"
    STATUS_RETIRED = "retired"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    serial_number = db.Column(db.String(50), unique=True, nullable=False)
    status = db.Column(db.String(50), default=STATUS_AVAILABLE, nullable=False)

    assignments = db.relationship(
        "Assignment",
        backref="asset",
        lazy="dynamic",
        cascade="all, delete-orphan"
    )

    @property
    def current_holder(self):
        active_assignment = self.assignments.filter_by(returned_at=None).first()
        if active_assignment:
            return active_assignment.assigned_to_user
        return None
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "serial_number": self.serial_number,
            "status": self.status,
            # We use the helper property .current_holder here
            "current_holder": self.current_holder.name if self.current_holder else None
        }
    def __repr__(self):
        return f"<Asset {self.name} | Status: {self.status}>"
