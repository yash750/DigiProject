from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from config import Config
from extensions import db, bcrypt, jwt
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    from models import user, asset, assignment, asset_log, organization
    from routes.asset_routes import asset_bp
    from routes.auth_routes import auth_bp, get_blocklist
    app.register_blueprint(asset_bp)
    app.register_blueprint(auth_bp)

    # Revoke logged-out tokens
    @jwt.token_in_blocklist_loader
    def check_blocklist(jwt_header, jwt_payload):
        return jwt_payload["jti"] in get_blocklist()

    @jwt.revoked_token_loader
    def revoked_token_response(jwt_header, jwt_payload):
        from flask import jsonify
        return jsonify({"error": "Token has been revoked"}), 401

    @jwt.expired_token_loader
    def expired_token_response(jwt_header, jwt_payload):
        from flask import jsonify
        return jsonify({"error": "Token has expired"}), 401

    @jwt.unauthorized_loader
    def missing_token_response(reason):
        from flask import jsonify
        return jsonify({"error": "Authentication required"}), 401

    # Allow React dev server to call the API
    @app.after_request
    def add_cors(response):
        response.headers["Access-Control-Allow-Origin"]  = "http://localhost:3000"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,DELETE,OPTIONS"
        return response

    @app.before_request
    def handle_options():
        from flask import request, Response
        if request.method == "OPTIONS":
            res = Response()
            res.headers["Access-Control-Allow-Origin"]  = "http://localhost:3000"
            res.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
            res.headers["Access-Control-Allow-Methods"] = "GET,POST,DELETE,OPTIONS"
            return res

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)