# Incident Brain

Incident Brain is an SRE incident-response dashboard and AI remediation assistant. It combines:

- a React + Vite frontend for incident triage
- a Node/Express AI server for Gemini-powered diagnosis and response generation
- a Python FastAPI backend that orchestrates the incident workflow and memory loop
- Hindsight-style long-term memory logic for incident recall and learning over time

This project is not a generic Google AI Studio starter app. It is a custom incident-response prototype built for the MICROSOFT hackathon challenge.

## What this repo contains

- [frontend](frontend): React UI for dashboards, incident feed, telemetry, playbooks, and post-mortems
- [frontend/server.ts](frontend/server.ts): Express + Gemini AI server
- [backend](backend): Python FastAPI app, incident reasoning agent, memory engine, and sandbox execution layer
- [assets](assets): supporting visuals

## Required environment variables

### Frontend / Express AI server
Create a file at [frontend/.env.local](frontend/.env.local) (or set the variable in your shell) with:

```env
GEMINI_API_KEY=your_google_ai_studio_key_here
```

This is used by [frontend/server.ts](frontend/server.ts) for Gemini-based diagnosis and chat responses.

### Python backend
Open a PowerShell terminal in the repo root or in the backend folder and set:

```powershell
$env:GROQ_API_KEY="your_groq_key"
$env:HINDSIGHT_API_KEY="your_hindsight_key"
```

The backend expects these in [backend/main.py](backend/main.py) and [backend/agent.py](backend/agent.py).

## Local setup

### 1) Frontend
From the repo root:

```powershell
cd frontend
npm install
```

Then run:

```powershell
npm run dev -- --host 127.0.0.1 --port 3000
```

The frontend should be available at:

```text
http://127.0.0.1:3000
```

### 2) Python backend
Open a separate terminal and run:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install fastapi uvicorn groq
```

Then start the API:

```powershell
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The backend should be available at:

```text
http://127.0.0.1:8000
```

## API routes

The backend exposes the main incident endpoints in [backend/main.py](backend/main.py):

- POST /api/analyze
- POST /api/feedback

These are used by the incident dashboard to run the incident workflow and capture feedback.

## Hindsight / memory flow

The project is designed around a memory loop for incident learning:

- recall previous service incidents and mitigation patterns
- choose a recommended action
- execute a sandboxed remediation
- retain a positive or negative memory depending on outcome

This logic lives in:

- [backend/agent.py](backend/agent.py)
- [backend/memory_engine.py](backend/memory_engine.py)

## Demo notes

This app is best demonstrated by repeatedly triggering the same type of incident pattern so the memory layer has a chance to recall prior successes or failures.

A typical flow is:

1. Pick a service and incident
2. Trigger analyze
3. Approve or reject the remediation
4. Repeat the same scenario to show recall and learned behavior

## Important note

The screenshots used during development were kept locally and removed from the repo to keep the project clean and avoid generic template artifacts. They are not required for the app to run.

## Troubleshooting

- If the frontend says the AI is unavailable, make sure [frontend/.env.local](frontend/.env.local) contains a valid Gemini key.
- If the backend fails, make sure the terminal has the proper Groq/Hindsight env vars set in the same session.
- If the browser hits 0.0.0.0 instead of localhost, use http://127.0.0.1:3000 or http://localhost:3000.

## License

This project is for hackathon/demo use and is not a generic starter template.

