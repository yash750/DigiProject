from extensions import db

class User(db.Model):
    __tablename__ = "users"

    id            = db.Column(db.Integer, primary_key=True)
    org_id        = db.Column(db.Integer, db.ForeignKey("organizations.id"), nullable=True, index=True)
    name          = db.Column(db.String(100), nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)
    role          = db.Column(db.String(20), default="employee")   # "admin" | "employee"
    # Profile fields
    phone         = db.Column(db.String(20),  nullable=True)
    department    = db.Column(db.String(80),  nullable=True)
    job_title     = db.Column(db.String(80),  nullable=True)

    def to_dict(self):
        return {
            "id":         self.id,
            "org_id":     self.org_id,
            "name":       self.name,
            "email":      self.email,
            "role":       self.role,
            "phone":      self.phone,
            "department": self.department,
            "job_title":  self.job_title,
            "initials":   "".join(p[0].upper() for p in self.name.split()[:2]),
        }

    def __repr__(self):
        return f"<User {self.name}>"
