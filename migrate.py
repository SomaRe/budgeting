from main import app, db
from flask_migrate import Migrate, upgrade, init, migrate


# migrate_obj = Migrate(app, db)

# with app.app_context():
#     init(directory='migrations')
#     migrate(directory='migrations', message='Initial migration')
#     migrate(directory='migrations', message='Add user_id to Labels and Categories')
#     upgrade(directory='migrations')

# create database
with app.app_context():
    db.create_all()