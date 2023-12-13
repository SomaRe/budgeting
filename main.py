from flask import Flask
from flask import render_template, request, redirect, url_for, flash
from flask_login import UserMixin
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from werkzeug.security import check_password_hash

import os
import pandas as pd
from datetime import datetime
import itertools
import json
import uuid
import secrets
app = Flask(__name__)

app.secret_key = secrets.token_hex(16)
app.config["JSON_SORT_KEYS"] = False
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
script_path = os.path.dirname(os.path.realpath(__file__))
db_path = os.path.join(script_path, "main.db")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

    def __repr__(self):
        return f"User: {self.username}"

transaction_labels = db.Table('transaction_labels',
    db.Column('transaction_id', db.String, db.ForeignKey('transactions.id'), primary_key=True),
    db.Column('label_id', db.Integer, db.ForeignKey('labels.id'), primary_key=True)
)

# class Labels with only one column label which is a string and is unique and not nullable
class Labels(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    label = db.Column(db.String, unique=False, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def __repr__(self):
        return f"Label: {self.label}"

class Categories(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String, unique=False, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    budget = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f"Category: {self.category}"

class Transactions(db.Model):
    id = db.Column(db.String, primary_key=True, nullable=False)
    date = db.Column(db.Date, nullable=False)
    payment = db.Column(db.String, nullable=False)
    value = db.Column(db.Float, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    category = db.relationship('Categories', backref=db.backref('transactions', lazy=True))
    labels = db.relationship('Labels', secondary=transaction_labels, backref=db.backref('transactions', lazy=True))
    comments = db.Column(db.String)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def __repr__(self):
        return f"Transaction: {self.id}, {self.date}, {self.payment}, {self.value}, {self.category}, {self.label}, {self.comments}"

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

db.init_app(app)

labels = ['amazon','onlinepurchase','shawarma', 'phone','wifi','paybright','facebook','kijiji','tools']

categories = ['Food','Rent','Room necessities','Transportation','Utilities','Financing','Groceries','Clothing','Personal','Entertainment','Gifts','Electronics','Hobby','Other']

# create database
with app.app_context():
    db.create_all()

# @app.before_first_request
# def create_tables():
#     db.create_all()

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, user_id)

# login
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for('main'))
        else:
            flash("Invalid username or password.")
            
    return render_template('login.html')

# logout
@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


# Helper functions
def budget_helper():
    # Get categories and transactions for the currently logged-in user
    categories = Categories.query.filter_by(user_id=current_user.id).all()
    transactions = Transactions.query.filter_by(user_id=current_user.id).order_by(Transactions.date).all()
    
    # Convert transactions to dictionaries and remove '_sa_instance_state'
    transactions = [transaction.__dict__ for transaction in transactions]
    for transaction in transactions:
        transaction.pop('_sa_instance_state')
    
    # Filter transactions for the current month
    current_month = pd.Timestamp.today().month
    transactions = [transaction for transaction in transactions if transaction['date'].month == current_month]

    # Initialize budget_dict with categories and their budgets, sums, differences, and percentages
    budget_dict = {category.category: {'budget': category.budget, 'sum': 0, 'difference': 0, 'percentage': 0} for category in categories}

    # Calculate the sum of transaction values for each category
    for transaction in transactions:
        budget_dict[transaction['category']]['sum'] += transaction['value']
    
    # Calculate the difference and percentage for each category
    for category, values in budget_dict.items():
        budget = int(values['budget'])
        sum_transactions = values['sum']
        
        difference = budget - sum_transactions
        percentage = round(sum_transactions / budget * 100) if budget > 0 else 0

        values['difference'] = difference
        values['percentage'] = percentage

    # Sort budget_dict by percentage in descending order
    budget_dict = dict(sorted(budget_dict.items(), key=lambda item: item[1]['percentage'], reverse=True))

    # remove categories with 0 budget
    budget_dict = {category: values for category, values in budget_dict.items() if values['budget'] > 0}

    return budget_dict


@app.route("/", methods=["GET", "POST"])
@login_required
def main():
    labels = [label.label for label in Labels.query.all()]
    categories = [category.category for category in Categories.query.all()]
    return render_template('transactions.html',labels=labels,categories=categories)

@app.route("/stats", methods=["GET", "POST"])
@login_required
def stats():
    return render_template('stats.html')

# multiple transactions insertion as a table
@app.route("/table_insert", methods=["GET", "POST"])
@login_required
def table_insert():
    return render_template('table_insert.html')


## Settings page ##
@app.route("/settings", methods=["GET", "POST"])
@login_required
def settings(): 
    labels = [label.label for label in Labels.query.filter_by(user_id=current_user.id).all()]
    categories = Categories.query.filter_by(user_id=current_user.id).all()
    categories_data = [
        {
            "category": category.category,
            "budget": category.budget
        }
        for category in categories
    ]
    return render_template('settings.html', labels=labels, categories=categories_data)

# add_category
@app.route("/settings/add_category", methods=["GET", "POST"])
@login_required
def add_category():
    data = request.get_json()
    # check if categories from data list are non-empty and not already in the user's categories; if not, add them to the database
    for category_name in data:
        if category_name and Categories.query.filter_by(category=category_name, user_id=current_user.id).first() is None:
            category = Categories(category=category_name, user_id=current_user.id)
            db.session.add(category)
    db.session.commit()
    return "success"

# delete_category
@app.route("/settings/category_delete", methods=["GET", "POST"])
@login_required
def category_delete():
    data = request.get_json()
    # delete data from categories table for the current user
    Categories.query.filter_by(category=data, user_id=current_user.id).delete()
    db.session.commit()
    # return the updated list of categories for the current user
    return {'categories': [category.category for category in Categories.query.filter_by(user_id=current_user.id).all()]}


# add_label
@app.route("/settings/add_label", methods=["GET", "POST"])
@login_required
def add_label():
    data = request.get_json()
    for label_name in data:
        if label_name and Labels.query.filter_by(label=label_name, user_id=current_user.id).first() is None:
            label = Labels(label=label_name, user_id=current_user.id)
            db.session.add(label)
    db.session.commit()
    return {'labels': [label.label for label in Labels.query.filter_by(user_id=current_user.id).all()]}

# delete label
@app.route("/settings/label_delete", methods=["GET", "POST"])
@login_required
def label_delete():
    data = request.get_json()
    # delete data from labels table for the current user
    Labels.query.filter_by(label=data, user_id=current_user.id).delete()
    db.session.commit()
    return {'labels': [label.label for label in Labels.query.filter_by(user_id=current_user.id).all()]}


#add budget
@app.route("/settings/add_budget", methods=["GET", "POST"])
@login_required
def add_budget():
    data = request.get_json()
    # Update the budget column for each category
    for category, budget in data.items():
        category_obj = Categories.query.filter_by(category=category, user_id=current_user.id).first()
        if category_obj:
            category_obj.budget = budget
            db.session.commit()
    return "passed"


## Settings page END ##

## Transactions page ##
# get budgeting
@app.route("/get_budgeting", methods=["GET", "POST"])
@login_required
def get_budgeting():
    budget_dict = budget_helper()
    return budget_dict

# get categories
@app.route("/get_categories", methods=["GET", "POST"])
def get_categories():
    categories = [{'id': category.id, 'name': category.category} for category in Categories.query.all()]
    return {'categories': categories}

# get labels
@app.route("/get_labels", methods=["GET", "POST"])
def get_labels():
    labels = [{'id': label.id, 'name': label.label} for label in Labels.query.all()]
    return {'labels': labels}


# add transaction
@app.route("/add_transaction", methods=["GET", "POST"])
@login_required
def add_transaction():
    data = request.get_json()
    # convert date to python date object
    data['date'] = pd.to_datetime(data['date']).date()

    # retrieve Label objects from the database
    label_objects = [Labels.query.get(label_id) for label_id in data['labels']]

    # add transaction to database
    transaction = Transactions(date=data['date'], payment=data['payment'], value=data['value'], category_id=data['category'], labels=label_objects, comments=data['comments'], user_id=current_user.id, id=uuid.uuid4().hex)
    db.session.add(transaction)
    db.session.commit()
    return "passed"


# add transactions from table in bulk
@app.route("/add_transactions_table", methods=["GET", "POST"])
@login_required
def add_transactions_table():
    data = request.get_json()
    # convert date to python date object
    for transaction in data:
        transaction['date'] = pd.to_datetime(transaction['date']).date()
    # add transactions to database
    for transaction in data:
        transaction = Transactions(date=transaction['date'], payment=transaction['payment'], value=transaction['value'], category=transaction['category'], labels=transaction['labels'], comments=transaction['comments'], user_id=current_user.id, id=uuid.uuid4().hex)
        db.session.add(transaction)
    db.session.commit()
    return "passed"


# get_transactions (send all transactions from database)
@app.route("/get_transactions", methods=["GET", "POST"])
@login_required
def get_transactions():
    # read Transactions from database, order by date
    transactions = Transactions.query.filter_by(user_id=current_user.id).order_by(Transactions.date.desc()).all()
    # create a list of dictionaries with the desired structure
    formatted_transactions = []
    for transaction in transactions:
        transaction_dict = {
            'id': transaction.id,
            'value': transaction.value,
            'comments': transaction.comments,
            'date': transaction.date,
            'payment': transaction.payment,
            'category': transaction.category.category,
            'labels': [label.label for label in transaction.labels],
            'user_id': transaction.user_id
        }
        formatted_transactions.append(transaction_dict)
    print(formatted_transactions)
    return {'transactions': formatted_transactions}


# return todays date
@app.route("/get_date", methods=["GET", "POST"])
@login_required
def get_date():
    # get first date from Transactions table
    try:
        date = Transactions.query.filter_by(user_id=current_user.id).order_by(Transactions.date.desc()).first().date
        return {'date': str(date)}
    except:
        return {'date': '2020-01-01'}

# delete transaction
@app.route("/delete_transaction", methods=["GET", "POST"])
@login_required
def delete_transaction():
    data = request.get_json()
    # delete data from transactions table
    Transactions.query.filter_by(id=data['id'], user_id=current_user.id).delete()
    db.session.commit()
    return "passed"

# update transaction
@app.route("/update_transaction", methods=["GET", "POST"])
@login_required
def update_transaction():
    data = request.get_json()
    # convert date to python date object
    data['date'] = pd.to_datetime(data['date']).date()
    # update data from transactions table
    Transactions.query.filter_by(id=data['id'], user_id=current_user.id).update({'date': data['date'], 'payment': data['payment'], 'value': data['value'], 'category': data['category'], 'labels': data['labels'], 'comments': data['comments']})
    db.session.commit()
    return "passed"


# main_chart (send data for main chart)
@app.route("/main_chart", methods=["GET", "POST"])
@login_required
def main_chart():
    # read Transactions from database, order by date
    transactions = Transactions.query.filter_by(user_id=current_user.id).order_by(Transactions.date.desc()).all()
    # convert transactions to a list of dictionaries
    transactions = [transaction.__dict__ for transaction in transactions]
    # remove _sa_instance_state from each dictionary
    for transaction in transactions:
        transaction.pop('_sa_instance_state')
    # create a dict with keys as months and values as lists of transactions only date and value
    transactions_dict = {}
    for transaction in transactions:
        date = transaction['date']
        month = date.strftime('%Y-%m')
        if month not in transactions_dict:
            transactions_dict[month] = []
        # get only day from date
        transactions_dict[month].append({'x': int(date.strftime('%d')), 'y': transaction['value']})
    # for every transaction_dict, sum the values of same dates
    for month in transactions_dict:
        transactions_dict[month] = pd.DataFrame(transactions_dict[month]).groupby('x').sum().reset_index().to_dict('records')
    # get first 3 key value pairs of transactions_dict
    transactions_dict = dict(itertools.islice(transactions_dict.items(), 3))
    return {'transactions': transactions_dict}


if __name__ == "__main__":
    app.run(debug=True)