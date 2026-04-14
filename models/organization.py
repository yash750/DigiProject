from extensions import db
from datetime import datetime, timezone

class Organization(db.Model):
    __tablename__ = "organizations"

    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(120), nullable=False)
    slug       = db.Column(db.String(80), unique=True, nullable=False)   # url-safe identifier
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    users  = db.relationship("User",  backref="organization", lazy="dynamic")
    assets = db.relationship("Asset", backref="organization", lazy="dynamic")

    def to_dict(self):
        return {"id": self.id, "name": self.name, "slug": self.slug}

    def __repr__(self):
        return f"<Organization {self.name}>"
