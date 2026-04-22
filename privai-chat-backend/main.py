import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel
from typing import Optional

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Default fallback key from .env (optional — frontend can override)
DEFAULT_API_KEY = os.getenv("GROQ_API_KEY", "")
DEFAULT_MODEL   = "llama-3.3-70b-versatile"


class ChatRequest(BaseModel):
    messages: list
    model:   Optional[str] = None      # frontend passes chosen model
    api_key: Optional[str] = None      # frontend passes user's key


@app.post("/chat")
async def chat(request: ChatRequest):
    # Use key from frontend if provided, else fall back to .env
    api_key = (request.api_key or "").strip() or DEFAULT_API_KEY
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="No API key provided. Add your Groq key in the app Settings."
        )

    model = (request.model or "").strip() or DEFAULT_MODEL

    try:
        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model=model,
            messages=request.messages,
            temperature=0.7,
            max_tokens=8192,
        )
        return {"reply": completion.choices[0].message.content}

    except Exception as e:
        err = str(e)
        # Surface rate-limit errors clearly
        if "rate_limit" in err.lower() or "429" in err:
            raise HTTPException(status_code=429, detail=f"Groq rate limit reached: {err}")
        if "authentication" in err.lower() or "api_key" in err.lower() or "401" in err:
            raise HTTPException(status_code=401, detail="Invalid API key. Check your Groq key in Settings.")
        raise HTTPException(status_code=500, detail=f"Groq Error: {err}")