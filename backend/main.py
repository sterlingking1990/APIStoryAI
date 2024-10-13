from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Depends
from fastapi.responses import JSONResponse
import json
from openai import OpenAI
from api_parser import parse_api_collection
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Annotated, Optional
from client.model.user import UserBase
from client.model.subscription import SubscriptionBase
from database import schema
from database.conn import engine, SessionLocal
from sqlalchemy.orm import Session,joinedload, sessionmaker
from sqlalchemy import text, create_engine
from sqlalchemy.engine import Result
import traceback
from pydantic import BaseModel

app = FastAPI()
origins = ['http://localhost:3000', 'https://localhost:3000', 'http://127.0.0.1:3000', 'https://127.0.0.1:3000', 'http://localhost:1','localhost:1']
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Update this to your React app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()

api_key = os.getenv('OPENAI_API_KEY')

schema.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
db_dependency = Annotated[Session, Depends(get_db)]

# Define a base dynamic model
class DynamicQueryResult(BaseModel):
    class Config:
        arbitrary_types_allowed = True  # Allow arbitrary types
        orm_mode = True  # For compatibility with SQLAlchemy


# Function to map SQL query result dynamically to a dictionary or model
def map_query_result_dynamically(result: Result) -> List[dict]:
    """
    Dynamically map the result to a list of dictionaries where column names are keys.
    :param result: SQLAlchemy Result object
    :return: List of dictionaries
    """
    keys = result.keys()  # Get the column names
    mapped_result = [dict(zip(keys, row)) for row in result.fetchall()]  # Convert each row to dict
    
    return mapped_result

# AI function to generate questions
def get_questions_from_ai(api_collection: dict,apiKey:str,connEnv:str) -> str:
    # Create the message content dynamically
    if connEnv == "mongo":
        
        prompt_content = f"""
Given the following API collection: {api_collection}, generate at least 5 business-related questions. For each question:
1. Inspect the schema for each endpoint to determine which combinations of collections and fields can be used.
2. Generate a valid MongoDB query that corresponds to the question. Ensure that:
- The schema name corresponds to the collection name.
- If a filter condition is needed, use a question mark (?) as a placeholder for any required parameters.
- The query should be executable in a MongoDB environment using `find()` or aggregation pipelines where necessary.
3. Suggest an appropriate type of visualization based on the nature of the query result (e.g., bar chart, table, line chart, heatmap, etc.).
Your output should be organized and follow this JSON structure:
    "business_questions": [
        {{
            "question": "<the business-related question>",
            "query": "<the corresponding MongoDB query>",
            "query_parameter": ["<the corresponding query parameter>",...],
            "visualization_suggestion": ["<the type of visualization suggested for the result>",...]
        }},
        ...
        ]
"""
        print(apiKey)
        client = OpenAI(api_key=apiKey)

        response = client.chat.completions.create(
            messages=[
            {
                "role": "system",
                "content": (
                "You are a professional data analyst assisting business owners in extracting insights "
                "from API collections and their schemas. Your task is to generate relevant business-related "
                "questions, the corresponding SQL query logic, and appropriate visualization suggestions. "
                "After inspecting the schema and determining possible combinations, if a query requires a "
                "WHERE clause, use a question mark placeholder. Ensure your output follows a structured JSON "
                "format that includes business-related questions, SQL queries, query parameters, and "
                "visualization suggestions.")
            },
            {
                "role": "user",
                "content": prompt_content
            }
        ],
        model="gpt-4",
        temperature = 0.3
    )
    
    # Extract the generated questions from the response

        return response
    else:
        prompt_content = f"""
    Given the following API collection: {api_collection}, generate at least 5 business-related questions. For each question:
    1. Inspect the schema for each endpoint to determine which combinations of tables and fields can be used.
    2. Generate a valid SQL query that corresponds to the question. Ensure that:
    - The schema name corresponds to the table name.
    - If a WHERE clause is needed, use a question mark (?) as a placeholder for any required parameters.
    - The SQL query should be executable in a PostgreSQL environment.
    3. Suggest an appropriate type of visualization based on the nature of the query result (e.g., bar chart, table, line chart, heatmap, etc.).
    Your output should be organized and follow this JSON structure:
        "business_questions": [
            {{
                "question": "<the business-related question>",
                "query": "<the corresponding SQL query>",
                "query_parameter": ["<the corresponding query parameter>",...],
                "visualization_suggestion": ["<the type of visualization suggested for the result>",...]
            }},
            ...
            ]
    """
        print(apiKey)
        client = OpenAI(api_key=apiKey)

        response = client.chat.completions.create(
            messages=[
            {
                "role": "system",
                "content": (
                "You are a professional data analyst assisting business owners in extracting insights "
                "from API collections and their schemas. Your task is to generate relevant business-related "
                "questions, the corresponding SQL query logic, and appropriate visualization suggestions. "
                "After inspecting the schema and determining possible combinations, if a query requires a "
                "WHERE clause, use a question mark placeholder. Ensure your output follows a structured JSON "
                "format that includes business-related questions, SQL queries, query parameters, and "
                "visualization suggestions.")
            },
            {
                "role": "user",
                "content": prompt_content
            }
        ],
        model="gpt-4",
        temperature = 0.3
    )
    
    # Extract the generated questions from the response

        return response



@app.post("/upload-api-collection/")
async def upload_api_collection(file: UploadFile = File(...),openAiApiKey: str =Form(...),
    connEnv: str = Form(...)):
    try:
        # Read the contents of the uploaded file
        contents = await file.read()

        # Ensure the file is in valid JSON format
        try:
            api_data = json.loads(contents)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON format in file.")

        # Get business-related questions from the AI
        all_response = get_questions_from_ai(api_data,openAiApiKey,connEnv)  # Ensure this function works as expected
        print(all_response)
        all_questions = json.loads(all_response.choices[0].message.content.strip())

        return {
            "summary": "API Collection processed successfully.",
            "questions": all_questions
        }
    except Exception as e:
        # Print stack trace for debugging
        print(f"Error: {e}")
        traceback.print_exc()  # This will print a detailed stack trace of the error

        # Return an internal server error message
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
    

@app.post("/execute-query/")
async def execute_query(payload: dict, db: Session = Depends(get_db)):
    query = payload["query"]
    user_inputs = payload.get("userInputs", {})  # Get all user inputs as a dictionary

    try:
        # Replace all placeholders (?) with the corresponding user input
        for idx, (param, user_input) in enumerate(user_inputs.items()):
            placeholder = f"?"
            # Replace the placeholder with the appropriate user input
            if user_input is not None:
                # Safely format the input for SQL
                query = query.replace(placeholder, f"'{user_input}'", 1)  # Replace only the first occurrence
            else:
                query = query.replace(placeholder, "NULL", 1)  # Replace with NULL if no input

        # Execute the SQL query dynamically
        result = db.execute(text(query))

        # Map the result dynamically to a dictionary
        mapped_result = map_query_result_dynamically(result)

        return {"result": mapped_result}

    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=400, detail=f"Error executing query: {str(e)}")

@app.post("/callback/")
async def subscribe_user(user: UserBase, db: db_dependency):
    db_user = schema.User(name=user.name,email=user.email, msisdn = user.msisdn)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    for subscription in user.subscriptions:
        db_subscription = schema.Subscription(service=subscription.service, service_duration=subscription.service_duration, date_subscribed = subscription.date_subscribed, description = subscription.description, end_date = subscription.end_date,user_id =db_user.id)
        db.add(db_subscription)
    db.commit()

@app.get("/get_user_and_subscriptions/{user_id}")
async def get_user_and_subcriptions(user_id:int, db: db_dependency):
    # query the user and eagerly load subscriptions
    
    user = db.query(schema.User).options(joinedload(schema.User.subscriptions)).filter(schema.User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code = 404, detail = "User not found")
    
    # map the user (and their subscriptions) to the pydantic model
    return UserBase.from_orm(user)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)