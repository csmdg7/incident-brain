import os
from typing import Any, Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from .agent import IncidentBrainAgent
except ImportError:  # pragma: no cover
    import sys
    from pathlib import Path

    backend_dir = Path(__file__).resolve().parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    from agent import IncidentBrainAgent


class AnalyzeRequest(BaseModel):
    service: str
    error_trace: str


class FeedbackRequest(BaseModel):
    service: str
    error_trace: str
    decision: Dict[str, Any]
    force_success: bool = True


app = FastAPI(title="Incident Brain API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def build_agent() -> IncidentBrainAgent:
    groq_key = os.getenv("GROQ_API_KEY", "demo")
    hindsight_key = os.getenv("HINDSIGHT_API_KEY", "demo")
    return IncidentBrainAgent(groq_api_key=groq_key, hindsight_api_key=hindsight_key)


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": "incident-brain-api",
        "timestamp": os.sys.version,
    }


@app.post("/api/analyze")
def analyze_incident(payload: AnalyzeRequest) -> Dict[str, Any]:
    agent = build_agent()
    result = agent.process_incident(payload.service, payload.error_trace)

    if not isinstance(result, dict):
        raise ValueError("Agent returned no analysis payload")

    return {
        "service": payload.service,
        "error_trace": payload.error_trace,
        "diagnosis": result.get("diagnosis", "No diagnosis was produced."),
        "confidence": float(result.get("confidence", 0.0)),
        "has_memory_match": bool(result.get("has_memory_match", False)),
        "selected_tool": result.get("selected_tool"),
        "tool_args": result.get("tool_args", {}),
        "recalled_memories": result.get("recalled_memories", []),
        "reasoning": result.get("diagnosis", "No reasoning available."),
    }


@app.post("/api/feedback")
def record_feedback(payload: FeedbackRequest) -> Dict[str, Any]:
    agent = build_agent()
    feedback = agent.execute_and_feedback(
        service=payload.service,
        error_trace=payload.error_trace,
        decision=payload.decision,
        force_success=payload.force_success,
    )
    return feedback
