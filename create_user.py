from main import app, User, db
from werkzeug.security import generate_password_hash

def create_new_user(username, password):
    hashed_password = generate_password_hash(password)
    new_user = User(username=username, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    print(f"New user '{username}' created successfully!")

if __name__ == "__main__":
    username = input("Enter a new username: ")
    password = input("Enter a new password: ")
    with app.app_context():
        create_new_user(username, password)
