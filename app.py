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
    from models import user, asset, assignment 
    from routes.asset_routes import asset_bp
    app.register_blueprint(asset_bp)


    return app
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)