from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate  
from config import Config
from extensions import db
migrate = Migrate() 

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db) 
    from models import user, asset, assignment, asset_log
    from routes.asset_routes import asset_bp
    app.register_blueprint(asset_bp)

    # Allow React dev server to call the API
    @app.after_request
    def add_cors(response):
        response.headers["Access-Control-Allow-Origin"]  = "http://localhost:3000"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,DELETE,OPTIONS"
        return response

    @app.before_request
    def handle_options():
        from flask import request, Response
        if request.method == "OPTIONS":
            res = Response()
            res.headers["Access-Control-Allow-Origin"]  = "http://localhost:3000"
            res.headers["Access-Control-Allow-Headers"] = "Content-Type"
            res.headers["Access-Control-Allow-Methods"] = "GET,POST,DELETE,OPTIONS"
            return res

    return app
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)