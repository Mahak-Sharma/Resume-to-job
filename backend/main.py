import os
import json
from utils.pdf_reader import extract_text_from_pdf
from utils.image_reader import extract_text_from_image
from utils.extractor import process_resume
from utils.recommender import recommend_jobs
import pandas as pd
import re
from fastapi import FastAPI, Query, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import requests
from typing import Optional, List, Dict, Any
import shutil
from pathlib import Path
import subprocess
import sys
import threading
from dotenv import load_dotenv
from urllib.parse import quote_plus

load_dotenv()

app = FastAPI(
    title="Resume Parser API",
    description="API for parsing resumes and recommending jobs",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Global variable to track if server is already running
_server_process = None

class JobRecommendation(BaseModel):
    title: str
    similarity_score: float
    matching_skills: Optional[List[str]] = None

class ExtractedInfo(BaseModel):
    Skills: List[str]
    Batch_Year: Optional[str] = None

class ResumeResponse(BaseModel):
    extractedInfo: ExtractedInfo
    recommendedJobs: List[JobRecommendation]

def allowed_file(filename: str) -> bool:
    """Check if the file type is allowed"""
    ALLOWED_EXTENSIONS = {'.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'}
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS

def job_titles(recommended_jobs, max_titles=10):
    titles = []

    for job in recommended_jobs[:max_titles]:
        title = job["title"]
        title = re.sub(r"[^\w\s]", "", title)
        titles.append(title)

    query = " OR ".join(titles)
    return quote_plus(query)


@app.get("/jobs/search")
def search_jobs(
    job_titles: List[str] = Query(...),
    results_per_page: int = 20
):
    """
    Fetch jobs from Adzuna using AI-recommended job titles.
    Uses multiple API calls because Adzuna does NOT support OR queries reliably.
    """

    print("Job titles received:", job_titles)

    if not job_titles:
        return {"count": 0, "jobs": []}

    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")

    if not app_id or not app_key:
        raise HTTPException(status_code=500, detail="Adzuna credentials missing")

    all_jobs = []
    seen_job_ids = set()

    # Limit calls to top 5 titles to stay within rate limits
    for title in job_titles[:5]:
        clean_title = title.strip()
        if not clean_title:
            continue

        encoded_title = quote_plus(clean_title)

        url = (
            f"https://api.adzuna.com/v1/api/jobs/in/search/1"
            f"?app_id={app_id}"
            f"&app_key={app_key}"
            f"&results_per_page={results_per_page}"
            f"&what={encoded_title}"
            f"&sort_by=relevance"
        )

        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            print(f"Adzuna error for '{clean_title}':", e)
            continue

        for job in data.get("results", []):
            job_id = job.get("id")
            if job_id and job_id not in seen_job_ids:
                seen_job_ids.add(job_id)
                all_jobs.append(job)

    print(f"Total jobs fetched: {len(all_jobs)}")

    # Format response for frontend
    formatted_jobs = []
    for job in all_jobs:
        formatted_jobs.append({
            "id": job["id"],
            "title": job["title"],
            "company_name": job["company"]["display_name"],
            "location": job["location"]["display_name"],
            "description": job["description"],
            "apply_link": job["redirect_url"],
            "category": job["category"]["label"],
            "salary_min": job.get("salary_min"),
            "salary_max": job.get("salary_max"),
            "contract_type": job.get("contract_type"),
            "created_at": job["created"],
        })

    return {
        "count": len(formatted_jobs),
        "jobs": formatted_jobs
    }



@app.post("/upload-resume", response_model=ResumeResponse)
async def upload_resume(file: UploadFile = File(...)):
    try:
        # Validate file type
        if not allowed_file(file.filename):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Allowed types: PDF, DOC, DOCX, JPG, JPEG, PNG"
            )

        # Create a temporary file path
        temp_file_path = UPLOAD_DIR / file.filename
        
        # Save the uploaded file
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract text based on file type
        file_extension = Path(file.filename).suffix.lower()
        if file_extension == '.pdf':
            text = extract_text_from_pdf(str(temp_file_path))
        elif file_extension in {'.jpg', '.jpeg', '.png'}:
            text = extract_text_from_image(str(temp_file_path))
        else:
            raise HTTPException(
                status_code=400,
                detail="File type not supported for text extraction"
            )

        if not text:
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the file"
            )

        # Process the resume
        info = process_resume(text)
        
        # Load job skills dataset
        df = pd.read_csv("job_skill_dataset.csv")
        
        # Get job recommendations
        recommended_jobs = recommend_jobs(info['Skills'], df)
        print("Recommended jobs: ", recommended_jobs)
        # Clean up the uploaded file
        os.remove(temp_file_path)

        # Prepare response
        output_data = {
            'extractedInfo': info,
            'recommendedJobs': recommended_jobs
        }

        return output_data

    except Exception as e:
        # Clean up the file in case of error
        if 'temp_file_path' in locals():
            try:
                os.remove(temp_file_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

def start_server():
    global _server_process
    if _server_process is None:
        _server_process = subprocess.Popen([sys.executable, __file__])
        return True
    return False

@app.post("/start-backend")
async def start_backend():
    """Endpoint to start the backend server if it's not running"""
    if start_server():
        return {"status": "started", "message": "Backend server started successfully"}
    return {"status": "already_running", "message": "Backend server is already running"}

if __name__ == "__main__":
    import uvicorn
    # Only start the server if this file is run directly
    if not _server_process:
        uvicorn.run(app, host="0.0.0.0", port=5000)
