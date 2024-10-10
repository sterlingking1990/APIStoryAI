from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import json
from openai import OpenAI
from api_parser import parse_api_collection
import os

load_dotenv()

api_key = os.getenv('OPENAI_API_KEY')
app = FastAPI()

# Endpoint to upload API Collection (JSON File)

# AI function to generate questions
def get_questions_from_ai(api_collection: dict) -> str:
    # Create the message content dynamically
    prompt_content = f"""
    Given the following API collection: {api_collection}, generate at least 5 business-related questions and for each question, inspect the schema, figure out which combinations are possible, and then generate appropriate sql query logic. For queries that requires WHERE clause, use a question mark placeholder. 
    Your output should be organized and follow an appropriate JSON format with the following structure: 
    
            "business_questions": [
                {{
                    "question": "<the business-related question>",
                    "sql_query": "<the corresponding SQL query>"
                }},
                ...
            ]
    """
    
    # Call the OpenAI API
    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        messages=[
             {
                "role": "system",
                "content": "You are a professional Data analyst helping business owners understand Insights from API collections and its schemas by generating all possible relevant questions and for each question appropriate sql query logic after having inspected the schema and figured out which combinations are possible. For queries that requires WHERE clause, use a question mark placeholder. Your output should be organized and follow an appropriate json format"
            },
            {
                "role": "user",
                "content": prompt_content
            }
        ],
        model="gpt-3.5-turbo",
        temperature = 0.3
    )
    
    # Extract the generated questions from the response

    return response

@app.post("/upload-api-collection/")
async def upload_api_collection(file: UploadFile):
    contents = await file.read()
    api_data = json.loads(contents)
    
    # Get questions from the AI
    print(api_data)
    all_response = get_questions_from_ai(api_data)
    all_questions  = json.loads(all_response.choices[0].message.content.strip())
    return {"summary": "API Collection processed successfully.", "questions": all_questions}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)