from flask import Flask
from flask import render_template, request
import pandas as pd
import json
import uuid

app = Flask(__name__)
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///main.db"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# class Labels with only one column label which is a string and is unique and not nullable
class Labels(db.Model):
    label = db.Column(db.String, primary_key=True, unique=True, nullable=False)

    def __repr__(self):
        return f"Label: {self.label}"

class Categories(db.Model):
    category = db.Column(db.String, primary_key=True, unique=True, nullable=False)

    def __repr__(self):
        return f"Category: {self.category}"

class Transactions(db.Model):
    id = db.Column(db.String, primary_key=True, unique=True, nullable=False)
    date = db.Column(db.Date, nullable=False)
    payment = db.Column(db.String, nullable=False)
    value = db.Column(db.Float, nullable=False)
    category = db.Column(db.String, db.ForeignKey("categories.category"))
    labels = db.Column(db.String, db.ForeignKey("labels.label"))
    comments = db.Column(db.String)

    def __repr__(self):
        return f"Transaction: {self.id}, {self.date}, {self.payment}, {self.value}, {self.category}, {self.label}, {self.comments}"

db.init_app(app)

labels = ['amazon','onlinepurchase','shawarma', 'phone','wifi','paybright','facebook','kijiji','tools']

categories = ['Food','Rent','Room necessities','Transportation','Utilities','Financing','Groceries','Clothing','Personal','Entertainment','Gifts','Electronics','Hobby','Other']

# create database
# with app.app_context():
#     db.create_all()

# Helper functions
def budget_helper():
    budgets = json.load(open('budget.json'))
    transactions = Transactions.query.order_by(Transactions.date).all()
    transactions = [transaction.__dict__ for transaction in transactions]
    for transaction in transactions:
        transaction.pop('_sa_instance_state')
    # get only transactions from current month
    transactions = [transaction for transaction in transactions if transaction['date'].month == pd.Timestamp.today().month]
    # make a dictionary with categories as keys and values as list which contains budget to the category, 
    # sum of transactions to the category and difference between budget and sum of transactions, percentage of sum of transactions to the budget
    budget_dict = {category:{'budget':budgets[category], 'sum':0, 'difference':0, 'percentage':0} for category in categories}
    # add sum of transactions to the category to the dictionary
    for transaction in transactions:
        budget_dict[transaction['category']]['sum'] += transaction['value']
    # add difference between budget and sum of transactions to the dictionary
    for category in budget_dict:
        budget_dict[category]['difference'] = int(budget_dict[category]['budget']) - budget_dict[category]['sum']
    # add percentage of sum of transactions to the budget to the dictionary
    for category in budget_dict:
        budget_dict[category]['percentage'] = round(int(budget_dict[category]['sum']) / int(budget_dict[category]['budget']) * 100)
    # return only the ones sum greater than 0
    return {category:budget_dict[category] for category in budget_dict if budget_dict[category]['sum'] > 0}

@app.route("/", methods=["GET", "POST"])
def main():
    labels = [label.label for label in Labels.query.all()]
    categories = [category.category for category in Categories.query.all()]
    budgets = budget_helper()
    print(budgets)
    return render_template('transactions.html',labels=labels,categories=categories, budgets=budgets)

@app.route("/stats", methods=["GET", "POST"])
def stats():
    return render_template('stats.html')


## Settings page ##
@app.route("/settings", methods=["GET", "POST"])
def settings():
    labels = [label.label for label in Labels.query.all()]
    categories = [category.category for category in Categories.query.all()]
    budgets = json.load(open('budget.json'))
    return render_template('settings.html',labels=labels,categories=categories, budgets=budgets)

# add_category
@app.route("/settings/add_category", methods=["GET", "POST"])
def add_category():
    data = request.get_json()
    # check if categories from data list are non empty already exists in database and if not add it to database
    for category in data:
        if category and Categories.query.filter_by(category=category).first() is None:
            category = Categories(category=category)
            db.session.add(category)
    db.session.commit()
    return {'categories': [category.category for category in Categories.query.all()]}

# delete category
@app.route("/settings/category_delete", methods=["GET", "POST"])
def category_delete():
    data = request.get_json()
    print('delete category:',data)
    # delete data from categories table
    Categories.query.filter_by(category=data).delete()
    db.session.commit()
    return {'categories': [category.category for category in Categories.query.all()]}

# add_label
@app.route("/settings/add_label", methods=["GET", "POST"])
def add_label():
    data = request.get_json()
    for label in data:
        if label and Labels.query.filter_by(label=label).first() is None:
            label = Labels(label=label)
            db.session.add(label)
    db.session.commit()
    return {'labels': [label.label for label in Labels.query.all()]}

# delete label
@app.route("/settings/label_delete", methods=["GET", "POST"])
def label_delete():
    data = request.get_json()
    print('delete label:',data)
    # delete data from labels table
    Labels.query.filter_by(label=data).delete()
    db.session.commit()
    return {'labels': [label.label for label in Labels.query.all()]}

#add budget
@app.route("/settings/add_budget", methods=["GET", "POST"])
def add_budget():
    data = request.get_json()
    print('add budget:',data)
    # save budget to json file
    with open('budget.json', 'w') as f:
        json.dump(data, f)
    return "passed"

## Settings page END ##

## Transactions page ##
# add transaction
@app.route("/add_transaction", methods=["GET", "POST"])
def add_transaction():
    data = request.get_json()
    print('add transaction:',data)
    print(data['labels'])
    # convert date to python date object
    data['date'] = pd.to_datetime(data['date']).date()
    # add transaction to database
    transaction = Transactions(date=data['date'], payment=data['payment'], value=data['value'], category=data['category'], labels=data['labels'], comments=data['comments'], id=uuid.uuid4().hex)
    db.session.add(transaction)
    db.session.commit()
    return "passed"

# get_transactions (send all transactions from database)
@app.route("/get_transactions", methods=["GET", "POST"])
def get_transactions():
    # read Transactions from database, order by date
    transactions = Transactions.query.order_by(Transactions.date.desc()).all()
    # convert transactions to a list of dictionaries
    transactions = [transaction.__dict__ for transaction in transactions]
    # remove _sa_instance_state from each dictionary
    for transaction in transactions:
        transaction.pop('_sa_instance_state')
    return {'transactions': transactions}

# return todays date
@app.route("/get_date", methods=["GET", "POST"])
def get_date():
    # get first date from Transactions table
    try:
        date = Transactions.query.order_by(Transactions.date.desc()).first().date
        return {'date': str(date)}
    except:
        return {'date': '2020-01-01'}

# delete transaction
@app.route("/delete_transaction", methods=["GET", "POST"])
def delete_transaction():
    data = request.get_json()
    print('delete transaction:',data['id'])
    # delete data from transactions table
    Transactions.query.filter_by(id=data['id']).delete()
    db.session.commit()
    return "passed"

# update transaction
@app.route("/update_transaction", methods=["GET", "POST"])
def update_transaction():
    data = request.get_json()
    print('update transaction:',data)
    # convert date to python date object
    data['date'] = pd.to_datetime(data['date']).date()
    # update data from transactions table
    Transactions.query.filter_by(id=data['id']).update({'date': data['date'], 'payment': data['payment'], 'value': data['value'], 'category': data['category'], 'labels': data['labels'], 'comments': data['comments']})
    db.session.commit()
    return "passed"

# main_chart (send data for main chart)
@app.route("/main_chart", methods=["GET", "POST"])
def main_chart():
    # read Transactions from database, order by date
    transactions = Transactions.query.order_by(Transactions.date.desc()).all()
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
    return {'transactions': transactions_dict}


# read csv file and return the total amount of money spent every month
@app.route("/stats/getTotalMonth", methods=['GET','POST'])
def getTotalMonth():
    df = pd.read_csv('transactions.csv')
    df['Date'] = pd.to_datetime(df['Date'])
    df['Month'] = df['Date'].dt.month
    df['Year'] = df['Date'].dt.year
    df = df.groupby(['Month','Year']).sum()
    df = df.reset_index()
    df = df.drop(['Comments'], axis=1)
    df = df.rename(columns={'Value':'Total'})
    return df.to_json()

# # read csv file and return the total amount of money spent every day of the month
@app.route("/stats/totalDayMonth", methods=['GET','POST'])
def totalDayMonth():
    df = pd.read_csv('transactions.csv')
    df = df.groupby(['Date']).sum()
    df = df.reset_index()
    df = df.drop(['Comments'], axis=1)
    # get first 7 characters of date into a list
    ym_list = df['Date'].str[:7].tolist()
    # remove repeated values from list
    ym_list = list(set(ym_list))
    # sort list
    ym_list.sort()
    dict = {}
    for ym in ym_list:
        df2 = df[df['Date'].str.contains(ym)]
        dict[ym] = [{'x': key[-2:],'y' : value} for key, value in df2.values]
    return dict


if __name__ == "__main__":
    app.run(debug=True)