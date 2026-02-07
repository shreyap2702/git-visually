# src/analyzer.py

from src.cloner import process_repo_clone
from src.file_processing import process_repository_for_json


def analyze_repository(repo_url: str, user_intent: str) -> dict:
    """
    Minimal service wrapper:
    repo_url -> raw pipeline JSON
    """

    cloned_repo_path = process_repo_clone(repo_url)

    if not cloned_repo_path:
        raise ValueError("Invalid GitHub repository URL")

    files_json = process_repository_for_json(cloned_repo_path)

    return {
        "repo_url": repo_url,
        "user_intent": user_intent,
        "analysis": files_json
    }
