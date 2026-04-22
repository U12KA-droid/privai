<div align="center">

<img src="https://github.com/user-attachments/assets/f1a4b411-3285-4566-8585-c1793e102033" alt="No-Logs AI Screenshot" width="720" style="border-radius:14px;margin:24px 0;box-shadow:0 8px 40px rgba(0,0,0,0.5);" />

# 🔒 PRIVAI

**Zero-retention AI chat powered by Groq's ultra-fast LPU inference**

[![License: MIT](https://img.shields.io/badge/License-MIT-6366f1.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB.svg)](https://react.dev/)
[![Groq](https://img.shields.io/badge/AI-Groq_LPU-F55036.svg)](https://groq.com/)
[![Status](https://img.shields.io/badge/Status-Active_Development-22c55e.svg)](#roadmap)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-818cf8.svg)](CONTRIBUTING.md)

> **⚠️ Transparency Notice:** Requests currently travel through **Groq's external servers** for model inference. This application stores nothing — but Groq's own terms of service may apply to API traffic. Our roadmap includes migrating to fully **private, project-owned servers** to eliminate all third-party data exposure.

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [How It Works — Step by Step](#-how-it-works--step-by-step)
- [Data Flow](#-data-flow)
- [Features](#-features)
- [Limitations & Honest Caveats](#-limitations--honest-caveats)
- [Supported Models](#-supported-models)
- [Requirements](#-requirements)
- [Installation & Setup](#-installation--setup)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌐 Overview

**Privai** is a privacy-first AI chat interface built on the principle that your conversations should belong only to you — and only for as long as you choose. No message is ever written to a database, file, cookie, or external analytics service. Everything lives in the browser's RAM (`React useState`), and disappears permanently the moment you close the tab or click **Clear Chat**.

### Who is this for?

| User | Fit |
|------|-----|
| Developers wanting a fast LLM interface without overhead | ✅ Perfect |
| Privacy-conscious researchers and professionals | ✅ Perfect |
| Companies handling sensitive internal data | ✅ With caveats (see [Limitations](#-limitations--honest-caveats)) |
| Anyone wanting a clean ChatGPT alternative | ✅ Great fit |

---

## 🔍 How It Works — Step by Step

### The Core Principle

```
No database  +  No localStorage  +  No cookies  =  No trace
```

Everything happens in RAM only. Here's the complete flow:

---

### Step 1 — Enter Your API Key

The user provides their personal Groq API key in the Settings panel.

```javascript
// Key lives ONLY in React state
const [apiKey, setApiKey] = useState("");

// It is NEVER written to:
// ❌ localStorage.setItem(...)
// ❌ document.cookie = ...
// ❌ Any analytics or logging call
// ❌ Any server-side storage
```

The key is sent to the backend only to authenticate requests against the Groq API — it is not stored there either.

---

### Step 2 — Type a Message

Your message is appended to a `messages` array in React state:

```javascript
const [messages, setMessages] = useState([]);

// Example state after two turns:
[
  { role: "user",      content: "Explain quantum entanglement" },
  { role: "assistant", content: "Quantum entanglement is..." }
]
```

The entire conversation history is sent on every request, which is how LLMs maintain context. This history exists nowhere except the browser tab.

---

### Step 3 — Request Sent to Local Backend

The frontend POSTs to your local FastAPI server:

```javascript
const payload = messages.map(({ role, content }) => ({ role, content }));

const res = await fetch("http://localhost:8000/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: payload,
    model: "llama-3.3-70b-versatile",
    api_key: "gsk_..."
  })
});
```

The local backend acts as a thin, stateless relay — it receives the request, forwards it to Groq, and returns the reply. Nothing is persisted.

---

### Step 4 — FastAPI Forwards to Groq

```python
@app.post("/chat")
async def chat(request: ChatRequest):
    api_key = request.api_key or os.getenv("GROQ_API_KEY")
    model   = request.model or "llama-3.3-70b-versatile"

    client = Groq(api_key=api_key)

    completion = client.chat.completions.create(
        model=model,
        messages=request.messages,   # Forwarded directly
        temperature=0.7,
        max_tokens=8192,
    )

    return {"reply": completion.choices[0].message.content}
    # ✅ No DB write
    # ✅ No file write
    # ✅ No log write
    # ✅ No session storage
```

---

### Step 5 — Response Displayed, Nothing Stored

The reply is added to the React state array and rendered in the UI. That's it. The cycle is complete with zero persistence.

---

## 🔀 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (React)                           │
│                                                                  │
│   User types         useState only        Messages rendered      │
│   message      ──────────────────────►   in the UI              │
│                       (RAM only)                                 │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │  HTTP POST /chat
                            │  { messages, model, api_key }
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│               FastAPI Backend  (localhost:8000)                   │
│                                                                  │
│   ✅ No database          ✅ No log files                        │
│   ✅ No session storage   ✅ No analytics                        │
│   ✅ Stateless relay only                                        │
│                                                                  │
└───────────────────────────┬──────────────────────────────────────┘
                            │  Groq Python SDK
                            │  (authenticated with your key)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Groq API  (external)               ⚠️          │
│                                                                  │
│   Open-source models: Llama 3.3, Gemma 2, Mixtral               │
│                                                                  │
│   ⚠️  Groq's own terms of service apply to API traffic          │
│   ⚠️  May include abuse prevention logging (see their policy)   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │  🔜  COMING SOON
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│            Project-Owned Private Servers                 🔜      │
│                                                                  │
│   ✅ No third party involved at any step                        │
│   ✅ Full infrastructure control                                 │
│   ✅ True end-to-end zero-log guarantee                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Features

### Privacy & Security

| Feature | Detail |
|---------|--------|
| **Zero Data Retention** | No DB, no files, no cookies — conversations exist in RAM only |
| **Your Key, Your Control** | Nobody else can read your requests or consume your quota |
| **Local Backend** | Traffic stays on your machine before reaching Groq |
| **No Account Required** | Users never need to register or share personal information |

### Performance & UX

| Feature | Detail |
|---------|--------|
| **⚡ Groq LPU Speed** | 500+ tokens/second — fastest inference available |
| **Open-Source Models** | Llama, Gemma, Mixtral — no proprietary black boxes |
| **Full Markdown Support** | Bold, italic, headers, lists, tables in AI replies |
| **Syntax Highlighting** | 50+ programming languages with `react-syntax-highlighter` |
| **Responsive Design** | Fully optimized for Desktop, Tablet, and Mobile |
| **Enter to Send** | Shift+Enter for a new line within the textarea |

### Controls & Settings

| Feature | Detail |
|---------|--------|
| **Model Selector** | 5 models with RPM, TPM, and context window details |
| **Request Counter** | Session-level tracker with warning near the limit |
| **Character Counter** | Live counter that turns amber → red as you approach the limit |
| **Rate Limit Alerts** | Clear banners for 429 errors, key issues, and connection failures |
| **Copy Button** | One-click copy on every message bubble |
| **How It Works Page** | In-app explainer with architecture diagram, pros/cons, and FAQ |

---

## ⚠️ Limitations & Honest Caveats

### Technical Limitations

| Limitation | Reason | Workaround |
|------------|--------|------------|
| **No conversation history across sessions** | State is erased on tab close | Export before closing *(coming soon)* |
| **Rate limits apply** | Groq free tier: ~30 req/min | Wait 60s or switch models |
| **Groq API key required** | Required for inference | Free account at console.groq.com |
| **Local backend must be running** | No hosted backend yet | See [Installation](#-installation--setup) |
| **No multi-user support** | One key per instance | Custom deployment needed for teams |
| **Context window cap** | 8K–32K tokens depending on model | Start a new chat for long sessions |
| **Text only (currently)** | No file/image upload | Vision model available for image prompts |
| **Internet connection required** | Groq API calls need network | Offline mode on roadmap (private servers) |

### Transparency About Groq

```
⚠️  READ THIS — Important Distinction

"No-Logs" means: this application logs nothing.

Your requests DO pass through Groq's API infrastructure.
Groq may apply their own policies per their Terms of Service:
  • Abuse prevention monitoring
  • Potential model improvement (check their current policy)

For a true 100% zero-log guarantee, you need to run
inference on hardware you control.

That is exactly what our private server milestone targets. 🔜
```

---

## 🤖 Supported Models

| Model | Speed | Quality | Context | Best For |
|-------|-------|---------|---------|----------|
| **Llama 3.3 70B** | Fast | Excellent | 32K | General chat, coding, analysis |
| **Llama 3.1 8B Instant** | Blazing | Good | 8K | Quick one-shot answers |
| **Gemma 2 9B** | Very Fast | Very Good | 8K | Summarization, writing |
| **Mixtral 8x7B** | Fast | Very Good | 32K | Long conversations |
| **Llama 3.2 90B Vision** | Moderate | Excellent | 8K | Image analysis *(coming soon)* |

### Groq Free Tier Limits

```
~30 requests / minute  (per model)
6,000 – 15,000 tokens / minute  (varies by model)
No strict daily cap — but fair use applies
```

---

## 📦 Requirements

### Frontend
```
Node.js  >= 18
npm  or  yarn
```

### Backend
```
Python  >= 3.9
pip
```

### Groq Account (Free)
```
1. Visit https://console.groq.com
2. Create a free account
3. Go to API Keys → Create a new key
4. Copy the key — it starts with gsk_
```

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/privai.git
cd privai
```

### 2. Start the Backend

```bash
cd backend

# Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate      # macOS / Linux
venv\Scripts\activate         # Windows

# Install dependencies
pip install fastapi uvicorn groq python-dotenv

# Optional: create .env to pre-load a fallback key
echo "GROQ_API_KEY=gsk_your_key_here" > .env

# Run the server
uvicorn main:app --reload --port 8000
```

> ✅ Backend running at `http://localhost:8000`
> 
> Visit `http://localhost:8000/docs` for the interactive Swagger UI.

### 3. Start the Frontend

```bash
# Open a new terminal tab
cd frontend

# Install dependencies
npm install
npm install react-markdown react-syntax-highlighter

# Start the dev server
npm run dev
```

> ✅ App running at `http://localhost:5173`

### 4. First-Time Setup

```
1. Open http://localhost:5173 in your browser
2. Click "Settings" in the header  (⚙ icon)
3. Paste your Groq API Key  (starts with gsk_)
4. Select a model from the list
5. Click "Save Settings"
6. Start chatting! 🎉
```

---

## 📁 Project Structure

```
no-logs-ai/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx          ← Main component — all logic, UI, state
│   │   ├── App.css          ← Dark theme, animations, responsive styles
│   │   └── index.css        ← Global reset, scrollbars, base typography
│   ├── index.html
│   └── package.json
│
├── backend/
│   ├── main.py              ← FastAPI server — stateless relay to Groq
│
│   └── requirements.txt
│
└── README.md
```

### `main.py` — Annotated

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

# CORS — allows the React frontend to call the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # In production: restrict to your domain
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    messages: list           # Full conversation history
    model:    Optional[str]  # Model selected in Settings
    api_key:  Optional[str]  # User's personal Groq key

@app.post("/chat")
async def chat(request: ChatRequest):
    # Prefer the key sent by the frontend; fall back to .env
    api_key = (request.api_key or "").strip() or os.getenv("GROQ_API_KEY")

    # api_key is NEVER logged, stored, or persisted in any form
    client = Groq(api_key=api_key)

    completion = client.chat.completions.create(
        model=request.model or "llama-3.3-70b-versatile",
        messages=request.messages,
        temperature=0.7,
        max_tokens=8192,
    )

    # Returns reply string — no write operations anywhere
    return {"reply": completion.choices[0].message.content}
```

---

## 📡 API Reference

### `POST /chat`

**Request Body**

```json
{
  "messages": [
    { "role": "user",      "content": "Hello!" },
    { "role": "assistant", "content": "Hi! How can I help?" },
    { "role": "user",      "content": "What is a neural network?" }
  ],
  "model":   "llama-3.3-70b-versatile",
  "api_key": "gsk_..."
}
```

**Successful Response `200`**

```json
{
  "reply": "A neural network is a computational model inspired by..."
}
```

**Rate Limit Error `429`**

```json
{
  "detail": "Groq rate limit reached: ..."
}
```

**Invalid API Key `401`**

```json
{
  "detail": "Invalid API key. Check your Groq key in Settings."
}
```

**Server / Model Error `500`**

```json
{
  "detail": "Groq Error: model not found or service unavailable"
}
```

---

## 🗺️ Roadmap

### Current Release ✅

- [x] Full chat interface with dark theme
- [x] User-provided API key (stored in-memory only)
- [x] 5-model selector with limits displayed
- [x] Markdown + syntax highlighting in AI responses
- [x] Rate limit, connection, and key error alerts
- [x] Request counter and character counter
- [x] "How It Works" in-app page
- [x] Fully responsive (Desktop, Tablet, Mobile)
- [x] Copy button on every message

### Upcoming 🔜

```
╔══════════════════════════════════════════════════════════════╗
║           PROJECT-OWNED PRIVATE SERVERS                 🔜   ║
║                                                              ║
║   The end goal: replace Groq API entirely with inference    ║
║   running on private, project-controlled hardware.          ║
║                                                              ║
║   What this means:                                          ║
║   ✅ Zero third-party access to any request or response     ║
║   ✅ Full control over the entire infrastructure stack      ║
║   ✅ True, auditable, end-to-end zero-log guarantee         ║
║   ✅ No external rate limits                                ║
║   ✅ Custom model fine-tuning possibilities                 ║
╚══════════════════════════════════════════════════════════════╝
```

| Feature | Priority | Status |
|---------|----------|--------|
| **Project-owned private inference servers** | 🔴 High | In planning |
| Streaming responses (token-by-token) | 🟡 Medium | Planned |
| Export conversation (Markdown / PDF) | 🟡 Medium | Planned |
| Image upload (Vision model support) | 🟡 Medium | Planned |
| Custom system prompt configuration | 🟡 Medium | Planned |
| Light / Dark theme toggle | 🟢 Low | Planned |
| Keyboard shortcuts | 🟢 Low | Planned |
| Token usage display | 🟢 Low | Planned |

---

## 🤝 Contributing

Contributions are welcome and appreciated. Here's how to get started:

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/no-logs-ai.git

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes, then commit
git add .
git commit -m "feat: brief description of your change"

# Push and open a Pull Request
git push origin feature/your-feature-name
```

### Contribution Guidelines

- Write clean, well-commented code
- Test on both desktop and mobile before submitting
- Do not introduce any form of persistence or tracking
- The zero-log principle is non-negotiable — PRs violating it will not be merged

---

## 📄 License

```
MIT License

Copyright (c) 2026 No-Logs AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
```

---

<div align="center">

**Built with care and a full commitment to your privacy.**

`No Logs · No Tracking · No Compromise`

<br/>

⭐ If this project helps you, consider starring the repo — it helps others find it.

</div>
