from pymongo import MongoClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
import traceback

# Detect database type based on connection string
def detect_db_type(connection_string: str):
    if connection_string.startswith("mongodb://") or connection_string.startswith("mongodb+srv://"):
        return "mongodb"
    elif connection_string.startswith("postgres://") or connection_string.startswith("postgresql://"):
        return "postgresql"
    else:
        raise ValueError("Unsupported database type or invalid connection string")

# MongoDB connection
def get_mongo_db(connection_string):
    client = MongoClient(connection_string)
    db = client.get_database()  # Get the default database or you can specify a specific one
    return db

# SQL Database connection
def get_sql_db(connection_string):
    engine = create_engine(connection_string)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

# MongoDB query execution
def execute_mongo_query(db, query_str):
    # Extract the collection name and the filter and projection from the query string
    # The query string should be formatted as: "db.collection.find(filter, projection)"
    # Example: "db.subscriptions.find({user_id: 5}, {service: 1})"

    # Remove "db." from the beginning and split by ".find("
    query_parts = query_str.replace("db.", "").split(".find(")
    
    if len(query_parts) != 2:
        raise ValueError("Invalid query format.")
    
    # Extract the collection name
    collection_name = query_parts[0].strip()
    
    # Split the find parameters
    find_params = query_parts[1].strip().rstrip(")").split(",")
    
    # Extract the filter and projection
    if len(find_params) == 1:
        filter_str = find_params[0].strip()
        projection_str = "{}"  # No projection specified
    elif len(find_params) == 2:
        filter_str = find_params[0].strip()
        projection_str = find_params[1].strip()
    else:
        raise ValueError("Invalid find parameters.")
    
    # Convert the filter and projection strings to dictionaries
    filter_query = json.loads(filter_str.replace(":", ":").replace("}", "}").replace("{", "{").replace("'", '"'))
    projection_query = json.loads(projection_str.replace(":", ":").replace("}", "}").replace("{", "{").replace("'", '"'))
    
    # Execute the query
    collection = db[collection_name]
    result = collection.find(filter_query, projection_query)
    
    return list(result)

# SQL query execution
def execute_sql_query(db_session, query, user_inputs):
    # Replace placeholders in the SQL query
    for idx, (param, user_input) in enumerate(user_inputs.items()):
        query = query.replace("?", f"'{user_input}'", 1)

    # Execute the query
    result = db_session.execute(text(query))
    
    # Retrieve column names
    column_names = result.keys()
    
    # Fetch all rows
    rows = result.fetchall()
    
    return rows, column_names 

