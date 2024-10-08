from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import json
from api_parser import parse_api_collection


app = FastAPI()

# Endpoint to upload API Collection (JSON File)

@app.post("/upload-api-collection/")
async def upload_api_collection(file: UploadFile = File(...)):
    if file.content_type != "application/json":
        raise HTTPException(status_code=400, detail = "Invalid file type, Only JSON files are allowed")
    content = await file.read()
    
    try:
        api_data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, details ="Invalid JSON file")
    
    summary, questions = parse_api_collection(api_data)
    
    return JSONResponse(content={"summary":summary, "questions":questions})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)