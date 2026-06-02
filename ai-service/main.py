import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

from services.extraction import extract_from_pdf, extract_from_image, extract_from_url
from services.generator import generate_questions_from_text, AiParseResponse

load_dotenv()

app = FastAPI(title="QuizVerse AI Microservice")

class TextRequest(BaseModel):
    text: str

class UrlRequest(BaseModel):
    url: str

@app.post("/ai/parse-text", response_model=AiParseResponse)
async def parse_text(request: TextRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    return await generate_questions_from_text(request.text)

@app.post("/ai/parse-pdf", response_model=AiParseResponse)
async def parse_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    content = await file.read()
    extracted_text = extract_from_pdf(content)
    
    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
    return await generate_questions_from_text(extracted_text)

@app.post("/ai/parse-image", response_model=AiParseResponse)
async def parse_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    content = await file.read()
    extracted_text = extract_from_image(content)
    
    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from image")
        
    return await generate_questions_from_text(extracted_text)

@app.post("/ai/parse-url", response_model=AiParseResponse)
async def parse_url(request: UrlRequest):
    if not request.url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid URL")
        
    extracted_text = await extract_from_url(request.url)
    
    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from URL")
        
    return await generate_questions_from_text(extracted_text)

@app.get("/health")
def health_check():
    return {"status": "ok"}
    
# Cache buster 1
