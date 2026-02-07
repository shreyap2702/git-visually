# src/api.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()


from src.analyzer import analyze_repository

app = FastAPI(title="Git Visually Backend")


class AnalyzeRepoRequest(BaseModel):
    repo_url: str
    user_intent: str


@app.post("/analyze")
def analyze_repo(request: AnalyzeRepoRequest):
    try:
        return analyze_repository(
            repo_url=request.repo_url,
            user_intent=request.user_intent
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
