from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Depends
from fastapi.responses import JSONResponse
import json
from openai import OpenAI
import openai
from api_parser import parse_api_collection
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Annotated, Optional
from client.model.user import UserBase
from client.model.subscription import SubscriptionBase
from client.model.googleuser import GoogleUser
from client.model.apistorysubscription import SubscriptionBase
from client.model.activitybase import ActivityRequest
from client.model.summarizerequest import SummarizeRequest
from client.model.visualizationrequest import VisualizationRequest
from database import schema,apistoryaischema
from database.conn import engine, SessionLocal
from sqlalchemy.orm import Session,joinedload, sessionmaker
from sqlalchemy import text, create_engine, select
from sqlalchemy.engine import Result
import traceback
from pydantic import BaseModel
from database.helpers.dbhelper import detect_db_type,get_mongo_db,get_sql_db,execute_mongo_query, execute_sql_query
from datetime import datetime, timedelta

app = FastAPI()
origins = ['http://localhost:3000', 'https://localhost:3000', 'http://127.0.0.1:3000', 'https://127.0.0.1:3000', 'http://localhost/:1','localhost/:1','localhost:1','https://localhost:1','payment:1']
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
def map_query_result_dynamically(rows, column_names):
    """
    Dynamically map the result to a list of dictionaries where column names are keys.
    :param rows: List of row tuples
    :param column_names: List of column names
    :return: List of dictionaries
    """
    mapped_result = [dict(zip(column_names, row)) for row in rows]  # Convert each row to dict
    return mapped_result

# AI function to generate questions
def get_questions_from_ai(api_collection: dict,apiKey:str,connEnv:str, questionNum:int = 5) -> str:
    # Create the message content dynamically
    if connEnv == "mongo":
        
        prompt_content = f"""
Given the following API collection: {api_collection}, generate {questionNum} business-related questions. For each question:
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
    Given the following API collection: {api_collection}, generate {questionNum} business-related questions. For each question:
    1. Inspect the schema for each endpoint to determine which combinations of tables and fields can be used.
    2. Generate a valid SQL query that corresponds to the question. Ensure that:
    - The schema name corresponds to the table name.
    - If a WHERE clause is needed, use a question mark (?) as a placeholder for any required parameters.
    - The SQL query should be executable in a PostgreSQL environment.
    - The SQL query should contain all possible columns or fields that references or extends the query
    - If you are selecting an identifier, do well to select other columns or fields that relates to the identifier so that it tells more about the identifier when possible.
    3. Retrieve all possible columns for the table(s) that extends the query.  
    4. Suggest an appropriate type of visualization based on the nature of the query result (e.g., bar chart, table, line chart, heatmap, etc.).
    Your output should be organized and follow this JSON structure:
        "business_questions": [
            {{
                "question": "<the business-related question>",
                "query": "<the corresponding SQL query>",
                "query_parameter": ["<the corresponding query parameter>",...],
                "visualization_suggestion": ["<the type of visualization suggested for the result>",...],
                "columns_involved": ["<the list of all other possible columns that extends the query>",...]
                
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
                "format that includes business-related questions, SQL queries, query parameters, "
                "visualization suggestions and all other possible columns that extends the query")
            },
            {
                "role": "user",
                "content": prompt_content
            }
        ],
        model="gpt-4o",
        temperature = 0.3
    )
    # Extract the generated questions from the response

        return response
    
def get_question_count_ai(api_collection: dict,apiKey:str,connEnv:str)->int:
    prompt_content = f"""
        Given the following API collection: {api_collection}, generate a count of business-related questions that can be derived from the collection. For each question:
        1. Inspect the schema for each endpoint to determine which combinations of tables and fields can be used.
        2. Generate a valid SQL query that corresponds to the question. Ensure that:
        - The schema name corresponds to the table name.
        - If a WHERE clause is needed, use a question mark (?) as a placeholder for any required parameters.
        3. Retrieve all possible columns for the table(s) that extend the query.
        4. Suggest an appropriate type of visualization based on the nature of the query result (e.g., bar chart, table, line chart, heatmap, etc.).

        Instead of listing individual questions and queries, return the **total count** of unique business-related questions that can be formulated from the API collection based on the schema analysis. Do not show how you derived to the count

        Output only in this JSON structure:
        {{
            "total_business_questions": <total_number_of_questions>
        }}
    """

    print(apiKey)
    client = OpenAI(api_key=apiKey)

    response = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional data analyst assisting business owners in extracting insights "
                    "from API collections and their schemas. Your task is to generate the **total number** of "
                    "business-related questions that can be derived from an API collection. "
                    "Ensure your response includes only the count of unique business-related questions, "
                    "without listing individual questions, showing how you derived to the count or SQL queries."
                )
            },
            {
                "role": "user",
                "content": prompt_content
            }
        ],
        model="gpt-4o",
        temperature=0.3
    )
    
    # Extract the generated questions from the response

    return response


def get_sql_query_from_ai(api_collection: dict,apiKey:str,connEnv:str,searchTerm: str)->str:
    prompt_content = f"""
    Given the collection: {api_collection}, generate an optimized SQL Query based on the following user query: '{searchTerm}' and they type of visualization suggested for the query result.
    
    Ensure the query is:
    - Accurate and relevant to the data in the collection.
    - Optimized for performance.
    - Adheres to best SQL practices, such as using appropriate JOINs, WHERE clauses, and indexing.
    
    Output only in the following JSON structure:
    {{
        "query": "<the SQL query based on the question asked>",
        "visualization_suggestion": ["<the type of visualization suggested for the result>",...],
    }}
"""


    print(apiKey)
    client = OpenAI(api_key=apiKey)

    response = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": (
                "You are a professional data and business intelligence analyst. "
                "Your role is to assist in generating optimized SQL queries based on user questions about a given data collection and they type of visualization suggested for the query result."
            )
            },
            {
                "role": "user",
                "content": prompt_content
            }
        ],
        model="gpt-4o",
        temperature=0.3
    )
    
    # Extract the generated questions from the response

    return response

def get_summary_from_ai(request:SummarizeRequest):
    client = OpenAI(api_key=request.aiKey)

        # Prepare the prompt for the GPT-4 model
    prompt = f"""
        Based on the following query result, summarize the information in relation to the question: '{request.question}'.

        Query Result: {request.queryResult}

        Please provide a concise and accurate summary that captures the main points related to the question.
        
        You can add along with the summary, a sentence or two about your take concerning the result.
        
        Also suggest an appropriate chart visualization if any for the result
        
        Output only in the following JSON structure:
    {{
        "summary": "<the summary from the question asked and the query result>",
        "visualization": "<an appropriate chart visualization for the result>"
    }}
        """

    # Call the OpenAI API to get a summary using GPT-4
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an expert AI assistant."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=300,  # Adjust token limit as per your need
        temperature=0.7  # Adjust for creativity of responses
    )
        
    return response


def get_visualization_from_ai(request:VisualizationRequest):
    client = OpenAI(api_key=request.aiKey)

        # Prepare the prompt for the GPT-4 model
    prompt = f"""
        You are given a dataset: {request.queryResult}
        
        Your task is to analyze it, determine the most appropriate chart type to visualize the data.
        
        Extract the necessary labels and values for plotting the chart. 
        
        Based on the structure and content of the dataset, decide between common chart types like bar, line, pie, or others. 
        
        After making your decision, present the output in the following JSON format:
    {{
  "chart_type": "<the appropriate chart type based on the dataset>",
  "labels": "<the labels to plot corresponding to the chart type>",
  "values": "<the values for the labels to plot the chart type>"
}}
        """

    # Call the OpenAI API to get a summary using GPT-4
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an expert AI assistant."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=300,  # Adjust token limit as per your need
        temperature=0.7  # Adjust for creativity of responses
    )
        
    return response


@app.post("/upload-api-collection/")
async def upload_api_collection(
    file: UploadFile = File(...),
    openAiApiKey: str = Form(...),
    connEnv: str = Form(...)
):
    try:
        # Read the contents of the uploaded file
        contents = await file.read()

        # Ensure the file is in valid JSON format
        try:
            api_data = json.loads(contents)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON format in file.")

        # Get business-related questions from the AI
        all_response = get_question_count_ai(api_data, openAiApiKey, connEnv)
        print(all_response)

        # Extract the actual JSON content (remove the ` ```json ` block)
        raw_content = all_response.choices[0].message.content.strip()
        print(raw_content)

        # Remove the leading and trailing code block markers if present
        if raw_content.startswith("```json"):
            raw_content = raw_content[7:]  # Removes "```json"
        if raw_content.endswith("```"):
            raw_content = raw_content[:-3]  # Removes trailing "```"

        # Now load the actual JSON content
        json_content = json.loads(raw_content)
        
        # Access the total_business_questions from the JSON content
        question_count = json_content.get("total_business_questions")

        if question_count is None:
            raise HTTPException(status_code=400, detail="Field 'total_business_questions' not found in the response.")

        return {
            "summary": "Total possible question count.",
            "question_count": question_count,
            "file_uploaded": api_data
        }

    except Exception as e:
        # Print stack trace for debugging
        print(f"Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error.")

@app.post("/get-questions-from-collection/")
async def get_questions_from_collection(file: UploadFile = File(...),openAiApiKey: str =Form(...),
    connEnv: str = Form(...), questionNum:int = Form(...)):
    try:
        # Read the contents of the uploaded file
        contents = await file.read()

        # Ensure the file is in valid JSON format
        try:
            api_data = json.loads(contents)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON format in file.")

        # Get business-related questions from the AI
        all_response = get_questions_from_ai(api_data,openAiApiKey,connEnv,questionNum)  # Ensure this function works as expected
        # Extract the actual JSON content (remove the ` ```json ` block)
        raw_content = all_response.choices[0].message.content.strip()

        # Remove the leading and trailing code block markers if present
        if raw_content.startswith("```json"):
            raw_content = raw_content[7:]  # Removes "```json"
        if raw_content.endswith("```"):
            raw_content = raw_content[:-3]  # Removes trailing "```"

        # Now load the actual JSON content
        all_questions = json.loads(raw_content)
        
        print(all_questions)
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
    connection_string = payload.get("connString")
    

    try:
        # Detect the type of database
        db_type = detect_db_type(connection_string)

        if db_type == "mongodb":
            # MongoDB logic
            mongo_db = get_mongo_db(connection_string)
            # Modify MongoDB query based on user inputs
            for key, value in user_inputs.items():
                query[key] = value  # Modify query based on user inputs
            result = execute_mongo_query(mongo_db, query)
            return {"result": result}
        
        elif db_type == "postgresql":
            # PostgreSQL or SQL logic
            sql_db = get_sql_db(connection_string)
    
            # Execute the SQL query and get both rows and column names
            rows, column_names = execute_sql_query(sql_db, query, user_inputs)
    
            # If it's a single scalar result like COUNT or SUM
            if len(rows) == 1 and len(rows[0]) == 1:
                return {"result": [{"value": rows[0][0]}]}  # Return the scalar value directly
    
            # Otherwise, map the result dynamically using column names
            mapped_result = map_query_result_dynamically(rows, column_names)
    
            print(mapped_result)
            return {"result": mapped_result}

    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=400, detail=f"Error executing query: {str(e)}")
    
@app.post("/get-sql-query")
async def get_sql_query_ai(file: UploadFile = File(...),openAiApiKey: str =Form(...),
    connEnv: str = Form(...),searchTerm:str = Form(...)):
    try:
        if not searchTerm:
            raise HTTPException(status_code = 400, detail = "Search term cannot be empty")
        # Read the contents of the uploaded file
        contents = await file.read()

        # Ensure the file is in valid JSON format
        try:
            api_data = json.loads(contents)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON format in file.")
        
        response = get_sql_query_from_ai(api_data,openAiApiKey,connEnv,searchTerm) # Ensure this function works as expected
        
        raw_content = response.choices[0].message.content.strip()
        print(raw_content)

        # Remove the leading and trailing code block markers if present
        if raw_content.startswith("```json"):
            raw_content = raw_content[7:]  # Removes "```json"
        if raw_content.endswith("```"):
            raw_content = raw_content[:-3]  # Removes trailing "```"

        # Now load the actual JSON content
        json_content = json.loads(raw_content)
        
       
        query_res = json_content.get("query")
        query_viz = json_content.get("visualization_suggestion")

            # Parse the result as JSON and extract the query
        try:
            return {
                "question": searchTerm,
                "query": query_res,
                "query_parameter": [],
                "visualization_suggestion":query_viz
                    }
        except (KeyError, json.JSONDecodeError) as e:
            raise HTTPException(status_code=500, detail=f"Error parsing the generated SQL query: {str(e)}")
    
    except Exception as ex:
        print(f"Unexpected error: {str(ex)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@app.post("/summarize-query")
async def summarize_query(request: SummarizeRequest):
    try:
        response = get_summary_from_ai(request)
        # Extract the response text (the summary)
        raw_content = response.choices[0].message.content.strip()

        # Remove the leading and trailing code block markers if present
        if raw_content.startswith("```json"):
            raw_content = raw_content[7:]  # Removes "```json"
        if raw_content.endswith("```"):
            raw_content = raw_content[:-3]  # Removes trailing "```"

        # Now load the actual JSON content
        summary_res = json.loads(raw_content)
        summary = summary_res.get("summary")
        viz = summary_res.get("visualization")

        return {
            "summary": summary,
            "visualization": viz
                }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")
    
import json
import re
from fastapi import HTTPException

@app.post("/generate-visualization")
async def generate_visualization(request: VisualizationRequest):
    try:
        response = get_visualization_from_ai(request)
        
        # Extract the raw content from the AI response
        raw_content = response.choices[0].message.content.strip()
        print(f"Raw content from AI: {raw_content}")
        
        # Use regex to extract the JSON part from the raw content
        json_match = re.search(r'\{.*\}', raw_content, re.DOTALL)
        
        if not json_match:
            raise HTTPException(status_code=500, detail="No valid JSON found in AI response")
        
        # Extract the JSON string
        json_str = json_match.group(0)
        print(f"Extracted JSON: {json_str}")
        
        # Load the actual JSON content
        visualization_res = json.loads(json_str)
        print(f"Parsed JSON: {visualization_res}")
        
        chart_type = visualization_res.get("chart_type")
        labels = visualization_res.get("labels")
        values = visualization_res.get("values")
        
        return {
            "chart_type": chart_type,
            "labels": labels,
            "values": values
        }
    
    except json.JSONDecodeError as json_err:
        raise HTTPException(status_code=500, detail=f"Error decoding JSON: {str(json_err)}")
    except Exception as e:
        print(f"Exception occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating visualization: {str(e)}")

    
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

# Function to save user data
def create_user(db: Session, user_data: GoogleUser):
    # Check if the user already exists
    existing_user = db.query(apistoryaischema.APIStoryUser).filter(apistoryaischema.APIStoryUser.email == user_data.email).first()
    
    if existing_user:
        return existing_user  # User already exists, return the existing user

    # Create a new user if they don't exist
    new_user = apistoryaischema.APIStoryUser(user_auth_id = user_data.user_auth_id, name = user_data.name, email = user_data.email)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
# Endpoint to handle Google sign-in
@app.post("/auth-google-signin")
async def google_signin(user_data: GoogleUser, db: Session = Depends(get_db)):
    user = create_user(db, user_data)
    
    # If the user is successfully logged in, return the user info
    return {
        "message": "User signed in successfully",
        "user": {
            "id": user.id,
            "user_auth_id":user_data.user_auth_id,
            "name": user_data.name,
            "email": user_data.email
        },
    }

def create_user_subscription(db: Session, sub_details: SubscriptionBase):
    existing_user = db.query(apistoryaischema.APIStoryUser).filter(apistoryaischema.APIStoryUser.id == sub_details.user_id).first()
    if existing_user:
        new_subscription = apistoryaischema.APIStorySubscription(
            user_id=sub_details.user_id,
            subscription_type=sub_details.subscription_type,
            subscription_amount=sub_details.subscription_amount,
            transaction_reference=sub_details.transaction_reference,
            start_date=sub_details.start_date,
            end_date=sub_details.end_date
        )
        print(new_subscription)
        db.add(new_subscription)
        db.commit()
        db.refresh(new_subscription)
        return new_subscription  # Return the new subscription object
    return None  # Change this to return None instead of a string


@app.post("/save-subscription")
async def save_user_subscription(sub_details: SubscriptionBase, db: Session = Depends(get_db)):
    subscription = create_user_subscription(db, sub_details)
    
    if subscription is None:  # Check if subscription is None
        return {
            "message": "User not found, subscription not created.",
        }

    print(subscription)
    return {
        "message": "Subscription Created Successfully",
        "subscriptionDetails": {
            "user_id": sub_details.user_id,
            "subscription_id": subscription.id,  # This will work now
            "subscription_type": sub_details.subscription_type,
            "subscription_amount": sub_details.subscription_amount,
            "transaction_reference": sub_details.transaction_reference,
            "start_date": subscription.start_date,
            "end_date": subscription.end_date
        }
    }
    
# Route to fetch user's subscription status
@app.get("/get-subscription-status/{user_id}")
def get_subscription_status(user_id: int, db: Session = Depends(get_db)):
    # Query the user from the database
    user = db.query(apistoryaischema.APIStoryUser).filter(apistoryaischema.APIStoryUser.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Query active subscription for the user
    
    subscription = db.query(apistoryaischema.APIStorySubscription).filter(
    apistoryaischema.APIStorySubscription.user_id == user_id,
    apistoryaischema.APIStorySubscription.end_date >= datetime.utcnow()  # Only fetch if end_date is in the future or today
    ).first()
    
    # If no active subscription found, default to free
    if not subscription:
        return {
            "user_id": user.id,
            "subscription_type": "Starter",  # Default subscription plan
            "is_active": False
        }
    
    # Return the subscription details
    return {
        "user_id": user.id,
        "subscription_type": subscription.subscription_type,  # Could be 'Pro', 'Basic', etc.
        "is_active": True
    }


# Helper function to check if there's an activity within the last 24 hours
def get_last_24hrs_activity(request:ActivityRequest, db:Session= Depends(get_db)):
    now = datetime.utcnow()
    start_time = now - timedelta(hours=24)
    
    # Query for user activity within the last 24 hours
    return db.query(apistoryaischema.APIStoryUserActivity).filter(
            apistoryaischema.APIStoryUserActivity.user_id == request.user_id,
            apistoryaischema.APIStoryUserActivity.activity_date >= start_time,
            apistoryaischema.APIStoryUserActivity.activity_type == request.activity_type
        ).first()

@app.post("/record-activities/")
def save_user_activity(request: ActivityRequest, db: Session = Depends(get_db)):
    """
    Save or update user activity based on last 24 hours.
    """
    # Validate activity type
    if request.activity_type not in ["Query", "Question", "Visualization"]:
        raise HTTPException(status_code=400, detail="Invalid activity type")

    # Check if an activity exists in the last 24 hours for the user
    last_activity = get_last_24hrs_activity(request, db)

    if last_activity:
        # Update the existing activity (increment count)
        last_activity.activity_count += 1
        last_activity.details = request.details if request.details else last_activity.details
        db.commit()
        db.refresh(last_activity)
        return {"message": "Activity updated", "activity": last_activity}
    else:
        # Create a new activity
        new_activity = apistoryaischema.APIStoryUserActivity(
            user_id=request.user_id,
            activity_type=request.activity_type,
            activity_count=1,  # Start with 1 for the new activity
            details=request.details,
            activity_date=datetime.now()
        )
        db.add(new_activity)
        db.commit()
        db.refresh(new_activity)
        return {"message": "Activity created", "activity": new_activity}
    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)