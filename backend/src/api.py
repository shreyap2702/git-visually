# src/api.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()


from src.analyzer import analyze_repository

app = FastAPI(title="Git Visually Backend")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRepoRequest(BaseModel):
    repo_url: str
    query: str | None = None
    user_intent: str | None = None


@app.post("/analyze")
def analyze_repo(request: AnalyzeRepoRequest):
    try:
        # Use 'query' if provided, otherwise fall back to 'user_intent'
        intent = request.query or request.user_intent or ""
        
        return analyze_repository(
            repo_url=request.repo_url,
            user_intent=intent
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
