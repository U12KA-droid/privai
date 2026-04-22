import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./App.css";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const GROQ_MODELS = [
  { id: "llama-3.3-70b-versatile",   label: "Llama 3.3 70B",      rpm: 30,  tpm: 6000,  ctx: 32768 },
  { id: "llama-3.1-8b-instant",      label: "Llama 3.1 8B Instant", rpm: 30, tpm: 6000,  ctx: 8192  },
  { id: "gemma2-9b-it",              label: "Gemma 2 9B",          rpm: 30,  tpm: 15000, ctx: 8192  },
  { id: "mixtral-8x7b-32768",        label: "Mixtral 8x7B",        rpm: 30,  tpm: 5000,  ctx: 32768 },
  { id: "llama-3.2-90b-vision-preview", label: "Llama 3.2 90B Vision", rpm: 15, tpm: 7000, ctx: 8192 },
];

const MAX_INPUT_CHARS = 4000;
const MAX_REQUESTS_PER_SESSION = 50;

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────
const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);
const EyeIcon = ({ off }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    {off ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// ALERT BANNER
// ─────────────────────────────────────────────────────────────────────────────
function AlertBanner({ type, message, onClose }) {
  // type: "warning" | "error" | "info"
  return (
    <div className={`alert-banner alert-${type}`}>
      <span className="alert-icon">
        {type === "error" ? "⛔" : type === "warning" ? "⚠️" : "ℹ️"}
      </span>
      <span className="alert-message">{message}</span>
      {onClose && (
        <button className="alert-close" onClick={onClose}><XIcon /></button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS PANEL (slide-in drawer)
// ─────────────────────────────────────────────────────────────────────────────
function SettingsPanel({ open, onClose, apiKey, setApiKey, model, setModel }) {
  const [showKey, setShowKey] = useState(false);
  const [localKey, setLocalKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setLocalKey(apiKey); }, [apiKey]);

  const handleSave = () => {
    setApiKey(localKey.trim());
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  };

  const selectedModel = GROQ_MODELS.find(m => m.id === model) || GROQ_MODELS[0];

  return (
    <>
      {/* Backdrop */}
      <div className={`drawer-backdrop ${open ? "open" : ""}`} onClick={onClose} />

      {/* Drawer */}
      <aside className={`settings-drawer ${open ? "open" : ""}`}>
        <div className="drawer-header">
          <span className="drawer-title">Settings</span>
          <button className="drawer-close" onClick={onClose}><XIcon /></button>
        </div>

        <div className="drawer-body">

          {/* API Key */}
          <div className="setting-group">
            <label className="setting-label">
              Groq API Key
              <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer"
                className="setting-link">Get key ↗</a>
            </label>
            <p className="setting-hint">
              Your key is stored only in memory — never saved to disk or server.
            </p>
            <div className="key-input-wrapper">
              <input
                type={showKey ? "text" : "password"}
                className="key-input"
                placeholder="gsk_..."
                value={localKey}
                onChange={e => setLocalKey(e.target.value)}
                spellCheck={false}
              />
              <button className="key-toggle" onClick={() => setShowKey(v => !v)}
                title={showKey ? "Hide key" : "Show key"}>
                <EyeIcon off={showKey} />
              </button>
            </div>
            {localKey && (
              <div className="key-status">
                <span className={`key-dot ${localKey.startsWith("gsk_") ? "valid" : "invalid"}`} />
                <span>{localKey.startsWith("gsk_") ? "Looks like a valid Groq key" : "Key should start with gsk_"}</span>
              </div>
            )}
          </div>

          {/* Model selector */}
          <div className="setting-group">
            <label className="setting-label">Model</label>
            <p className="setting-hint">Choose based on speed vs quality trade-off.</p>
            <div className="model-list">
              {GROQ_MODELS.map(m => (
                <button
                  key={m.id}
                  className={`model-card ${model === m.id ? "selected" : ""}`}
                  onClick={() => setModel(m.id)}
                >
                  <div className="model-card-top">
                    <span className="model-name">{m.label}</span>
                    {model === m.id && <span className="model-check">✓</span>}
                  </div>
                  <div className="model-meta">
                    <span>{m.rpm} req/min</span>
                    <span>·</span>
                    <span>{(m.tpm / 1000).toFixed(0)}K tok/min</span>
                    <span>·</span>
                    <span>{(m.ctx / 1024).toFixed(0)}K ctx</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Rate limits info */}
          <div className="setting-group">
            <label className="setting-label">Groq Free Tier Limits</label>
            <div className="limits-table">
              <div className="limits-row header">
                <span>Limit</span><span>Value</span>
              </div>
              <div className="limits-row">
                <span>Requests / minute</span>
                <span className="limits-val">{selectedModel.rpm}</span>
              </div>
              <div className="limits-row">
                <span>Tokens / minute</span>
                <span className="limits-val">{selectedModel.tpm.toLocaleString()}</span>
              </div>
              <div className="limits-row">
                <span>Context window</span>
                <span className="limits-val">{selectedModel.ctx.toLocaleString()}</span>
              </div>
              <div className="limits-row">
                <span>Requests / session (app limit)</span>
                <span className="limits-val">{MAX_REQUESTS_PER_SESSION}</span>
              </div>
            </div>
          </div>

        </div>

        <div className="drawer-footer">
          <button className="save-btn" onClick={handleSave}>
            {saved ? "✓ Saved!" : "Save Settings"}
          </button>
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOW IT WORKS PAGE
// ─────────────────────────────────────────────────────────────────────────────
function HowItWorksPage({ onBack }) {
  return (
    <div className="hiw-page">
      <div className="hiw-inner">

        <button className="hiw-back" onClick={onBack}>
          <ChatIcon /> Back to Chat
        </button>

        <div className="hiw-hero">
          <div className="hiw-hero-icon">🔒</div>
          <h1 className="hiw-title">How Privai Works</h1>
          <p className="hiw-subtitle">
            A private, zero-retention chat interface powered by Groq's ultra-fast inference.
          </p>
        </div>

        {/* How it works steps */}
        <section className="hiw-section">
          <h2 className="hiw-section-title">How It Works</h2>
          <div className="hiw-steps">
            {[
              {
                n: "01", icon: "🔑",
                title: "You provide your own API key",
                body: "Your Groq API key is entered in Settings and kept only in the browser's memory (React state). It's never written to localStorage, cookies, a database, or any server."
              },
              {
                n: "02", icon: "📝",
                title: "You type a message",
                body: "Your message is stored in useState — a JavaScript variable that lives only while the tab is open. Closing or refreshing the tab erases it permanently."
              },
              {
                n: "03", icon: "⚡",
                title: "Request goes directly to your backend",
                body: "The full conversation history is sent to your local FastAPI server at localhost:8000/chat. The backend forwards it to Groq using your API key. No third-party relay, no logging middleware."
              },
              {
                n: "04", icon: "🤖",
                title: "Groq runs the model",
                body: "Groq processes your messages with the selected open-source model (Llama, Mixtral, Gemma) and streams back a response in milliseconds."
              },
              {
                n: "05", icon: "🗑️",
                title: "Nothing is persisted",
                body: "The reply is shown in the chat. No database write happens anywhere in this stack. Clear Chat or close the tab — the conversation is gone."
              },
            ].map(step => (
              <div className="hiw-step" key={step.n}>
                <div className="hiw-step-num">{step.n}</div>
                <div className="hiw-step-icon">{step.icon}</div>
                <div className="hiw-step-body">
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture diagram */}
        <section className="hiw-section">
          <h2 className="hiw-section-title">Architecture</h2>
          <div className="hiw-arch">
            <div className="arch-node user-node">
              <span>🧑</span>Browser
            </div>
            <div className="arch-arrow">
              <span className="arch-arrow-label">HTTPS POST /chat</span>
              <div className="arch-line" />
            </div>
            <div className="arch-node server-node">
              <span>🐍</span>FastAPI
            </div>
            <div className="arch-arrow">
              <span className="arch-arrow-label">Groq SDK</span>
              <div className="arch-line" />
            </div>
            <div className="arch-node groq-node">
              <span>⚡</span>Groq API
            </div>
          </div>
          <p className="arch-note">No database, no auth server, no analytics, no CDN logging.</p>
        </section>

        {/* Pros & Cons */}
        <section className="hiw-section hiw-pros-cons">
          <div className="pros-col">
            <h2 className="hiw-section-title pros-title">✅ Advantages</h2>
            <ul className="feature-list pros-list">
              {[
                ["Zero data retention", "Messages live only in RAM. Close the tab → gone."],
                ["Your API key, your control", "No one else can use your quota or read your requests."],
                ["Ultra-fast inference", "Groq's LPU hardware delivers 500+ tokens/second."],
                ["Open-source models", "Llama, Gemma, Mixtral — no proprietary black boxes."],
                ["Free to start", "Groq free tier gives generous daily limits."],
                ["Local backend", "Traffic stays on your machine; no cloud intermediary."],
                ["No account required", "Users don't need to sign up or share personal data."],
                ["Markdown & code support", "Full syntax highlighting in AI responses."],
              ].map(([title, desc]) => (
                <li key={title} className="feature-item">
                  <span className="feature-title">{title}</span>
                  <span className="feature-desc">{desc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="cons-col">
            <h2 className="hiw-section-title cons-title">⚠️ Limitations</h2>
            <ul className="feature-list cons-list">
              {[
                ["No history persistence", "Refresh the page and your conversation disappears."],
                ["Rate limits apply", "Free Groq tier: ~30 req/min, varies per model."],
                ["API key required", "Users must create a Groq account to get a key."],
                ["Local backend required", "FastAPI server must be running on the user's machine."],
                ["No multi-user support", "One API key per instance; no user accounts."],
                ["Context window cap", "Long conversations get cut off at the model's token limit."],
                ["No file uploads", "Text-only; no image or document support (unless using vision model)."],
                ["Internet required", "Groq API calls need an active connection."],
              ].map(([title, desc]) => (
                <li key={title} className="feature-item">
                  <span className="feature-title">{title}</span>
                  <span className="feature-desc">{desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Models comparison */}
        <section className="hiw-section">
          <h2 className="hiw-section-title">Model Comparison</h2>
          <div className="model-comparison">
            <div className="mc-header">
              <span>Model</span><span>Speed</span><span>Quality</span><span>Context</span>
            </div>
            {[
              { name: "Llama 3.3 70B",      speed: "Fast",      quality: "Excellent", ctx: "32K" },
              { name: "Llama 3.1 8B Instant",speed: "Blazing",   quality: "Good",      ctx: "8K"  },
              { name: "Gemma 2 9B",          speed: "Very Fast", quality: "Very Good", ctx: "8K"  },
              { name: "Mixtral 8x7B",        speed: "Fast",      quality: "Very Good", ctx: "32K" },
              { name: "Llama 3.2 90B Vision",speed: "Moderate",  quality: "Excellent", ctx: "8K"  },
            ].map(m => (
              <div className="mc-row" key={m.name}>
                <span className="mc-name">{m.name}</span>
                <span className="mc-pill speed">{m.speed}</span>
                <span className="mc-pill quality">{m.quality}</span>
                <span className="mc-ctx">{m.ctx}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="hiw-section">
          <h2 className="hiw-section-title">FAQ</h2>
          <div className="faq-list">
            {[
              ["Is my API key sent to any external server?",
               "No. Your key is stored in the browser's memory and sent only to your local FastAPI backend (localhost:8000). It's never transmitted to this app's developers or any third party."],
              ["What happens when I click Clear Chat?",
               "The messages array in React state is reset to empty. Since nothing was ever written to disk or a database, there is nothing else to delete."],
              ["Can I use this in production for multiple users?",
               "Not as-is. Each user would need their own API key and a running backend. For a multi-user setup you'd add authentication, key management, and a proper deployment."],
              ["Why do I get a rate limit error?",
               "Groq's free tier limits requests per minute per model. If you hit the limit, wait 60 seconds or switch to a model with higher TPM. The app shows a warning before you get close."],
              ["Does Groq log my conversations?",
               "Groq's API may log requests for abuse prevention per their terms of service. The 'No-Logs' guarantee applies to this application's code — no logging on the frontend or the FastAPI backend."],
            ].map(([q, a]) => (
              <details className="faq-item" key={q}>
                <summary className="faq-q">{q}</summary>
                <p className="faq-a">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="hiw-footer">
          <button className="hiw-back-bottom" onClick={onBack}>
            <ChatIcon /> Back to Chat
          </button>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COPY BUTTON
// ─────────────────────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy} title="Copy">
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING DOTS
// ─────────────────────────────────────────────────────────────────────────────
function LoadingDots() {
  return (
    <div className="message ai">
      <div className="avatar ai-avatar">AI</div>
      <div className="loading-bubble"><span /><span /><span /></div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE BUBBLE
// ─────────────────────────────────────────────────────────────────────────────
function MessageBubble({ role, content }) {
  const isUser = role === "user";
  const mdComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div"
          customStyle={{ margin: "8px 0", borderRadius: "8px", fontSize: "12.5px", border: "1px solid var(--border)" }}
          {...props}>
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className="inline-code" {...props}>{children}</code>
      );
    },
  };
  return (
    <div className={`message ${isUser ? "user" : "ai"}`}>
      <div className={`avatar ${isUser ? "user-avatar" : "ai-avatar"}`}>
        {isUser ? "U" : "AI"}
      </div>
      <div className={`bubble ${isUser ? "user-bubble" : "ai-bubble"}`}>
        {isUser
          ? <p className="user-text">{content}</p>
          : <ReactMarkdown components={mdComponents}>{content}</ReactMarkdown>
        }
        <CopyButton text={content} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ hasKey, onOpenSettings }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">🔒</div>
      <p className="empty-title">Privai</p>
      {!hasKey ? (
        <>
          <p className="empty-sub">Add your Groq API key to start chatting</p>
          <button className="empty-setup-btn" onClick={onOpenSettings}>
            <SettingsIcon /> Open Settings
          </button>
        </>
      ) : (
        <>
          <p className="empty-sub">Start a conversation — nothing is ever saved or logged</p>
          <div className="empty-chips">
            <span>Ask anything</span>
            <span>Write code</span>
            <span>Analyze text</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT COUNTER
// ─────────────────────────────────────────────────────────────────────────────
function CharCounter({ count }) {
  const pct = count / MAX_INPUT_CHARS;
  const cls = pct > 0.9 ? "danger" : pct > 0.75 ? "warn" : "";
  if (count === 0) return null;
  return (
    <span className={`char-counter ${cls}`}>
      {count}/{MAX_INPUT_CHARS}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [page, setPage]             = useState("chat"); // "chat" | "howto"
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState("");
  const [isLoading, setIsLoading]   = useState(false);
  const [apiKey, setApiKey]         = useState("");
  const [model, setModel]           = useState(GROQ_MODELS[0].id);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [alert, setAlert]           = useState(null); // { type, message }

  const textareaRef = useRef(null);
  const bottomRef   = useRef(null);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ── Auto-resize textarea ───────────────────────────────────────────────────
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val.length > MAX_INPUT_CHARS) return; // hard stop
    setInput(val);
    autoResize();
    // Clear char limit alert if user reduces
    if (alert?.type === "warning" && val.length < MAX_INPUT_CHARS) setAlert(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Limit checks ───────────────────────────────────────────────────────────
  const checkLimits = () => {
    if (!apiKey || !apiKey.startsWith("gsk_")) {
      setAlert({ type: "error", message: "No valid API key found. Go to Settings and add your Groq key." });
      return false;
    }
    if (requestCount >= MAX_REQUESTS_PER_SESSION) {
      setAlert({ type: "error", message: `You've reached the session limit of ${MAX_REQUESTS_PER_SESSION} requests. Clear the chat to reset.` });
      return false;
    }
    if (input.length >= MAX_INPUT_CHARS) {
      setAlert({ type: "warning", message: `Message too long (${input.length}/${MAX_INPUT_CHARS} chars). Please shorten it.` });
      return false;
    }
    return true;
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    if (!checkLimits()) return;

    setAlert(null);

    const userMsg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // Warn when approaching session limit
    const nextCount = requestCount + 1;
    setRequestCount(nextCount);
    if (nextCount >= MAX_REQUESTS_PER_SESSION - 5) {
      setAlert({
        type: "warning",
        message: `You're approaching the session limit. ${MAX_REQUESTS_PER_SESSION - nextCount} requests remaining.`
      });
    }

    try {
      const payload = updatedMessages.map(({ role, content }) => ({ role, content }));

      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Pass key & model so backend can use them dynamically (optional — see note below)
          "X-Api-Key": apiKey,
          "X-Model": model,
        },
        body: JSON.stringify({ messages: payload, model, api_key: apiKey }),
      });

      if (res.status === 429) {
        setAlert({ type: "error", message: "Rate limit reached (429). Wait a minute before sending more messages." });
        setMessages(prev => prev.slice(0, -1)); // remove optimistic user msg
        setIsLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const data = await res.json();
      const reply = data.reply || "No response received.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const isRateLimit = err.message.includes("429") || err.message.toLowerCase().includes("rate");
      if (isRateLimit) {
        setAlert({ type: "error", message: "Rate limit reached. Please wait 60 seconds and try again." });
      } else {
        setAlert({ type: "error", message: `Connection error: ${err.message}. Is the backend running on localhost:8000?` });
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  // ── Clear chat ─────────────────────────────────────────────────────────────
  const clearChat = () => {
    setMessages([]);
    setInput("");
    setRequestCount(0);
    setAlert(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const isEmpty    = messages.length === 0 && !isLoading;
  const hasKey     = apiKey.startsWith("gsk_");
  const modelLabel = GROQ_MODELS.find(m => m.id === model)?.label || model;

  // ── How It Works page ──────────────────────────────────────────────────────
  if (page === "howto") return <HowItWorksPage onBack={() => setPage("chat")} />;

  // ── Chat page ──────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <SettingsPanel
        open={settingsOpen} onClose={() => setSettingsOpen(false)}
        apiKey={apiKey} setApiKey={setApiKey}
        model={model} setModel={setModel}
      />

      {/* ── Header ── */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">P</div>
          <span className="logo-text">Privai</span>
        </div>

        <div className="header-center">
          <div className="zero-logs-badge">
            <span className="pulse-dot" />
            <span className="badge-label">Zero Logs</span>
          </div>
          {hasKey && (
            <div className="model-badge">
              <span className="model-badge-dot" />
              <span className="model-badge-label">{modelLabel}</span>
            </div>
          )}
        </div>

        <div className="header-right">
          <button className="nav-btn" onClick={() => setPage("howto")} title="How it works">
            <InfoIcon />
            <span className="nav-btn-label">How it works</span>
          </button>
          <button className={`nav-btn ${!hasKey ? "nav-btn-alert" : ""}`}
            onClick={() => setSettingsOpen(true)} title="Settings">
            <SettingsIcon />
            <span className="nav-btn-label">Settings</span>
            {!hasKey && <span className="nav-btn-dot" />}
          </button>
          {messages.length > 0 && (
            <button className="clear-btn" onClick={clearChat} title="Clear conversation">
              <TrashIcon />
              <span className="btn-label">Clear</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Alert Banner ── */}
      {alert && (
        <AlertBanner type={alert.type} message={alert.message}
          onClose={() => setAlert(null)} />
      )}

      {/* ── Chat Area ── */}
      <main className="chat-area">
        {isEmpty ? (
          <EmptyState hasKey={hasKey} onOpenSettings={() => setSettingsOpen(true)} />
        ) : (
          <div className="messages-wrapper">
            {messages.map((msg, i) => (
              <MessageBubble key={i} role={msg.role} content={msg.content} />
            ))}
            {isLoading && <LoadingDots />}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="input-area">
          <div className={`input-wrapper ${!hasKey ? "input-disabled" : ""}`}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                !hasKey
                  ? "Add your Groq API key in Settings to start…"
                  : "Send a message… (Enter to send, Shift+Enter for new line)"
              }
              rows={1}
              disabled={isLoading || !hasKey}
            />
            <CharCounter count={input.length} />
            <button className="send-btn" onClick={sendMessage}
              disabled={!input.trim() || isLoading || !hasKey} title="Send">
              <SendIcon />
            </button>
          </div>

          {/* Request counter */}
          {requestCount > 0 && (
            <div className="req-counter">
              <span className={requestCount >= MAX_REQUESTS_PER_SESSION * 0.8 ? "req-warn" : ""}>
                {requestCount}/{MAX_REQUESTS_PER_SESSION} requests this session
              </span>
            </div>
          )}
        </div>

        <p className="footer-note">
          Your conversations are never stored or used for training
        </p>
      </footer>
    </div>
  );
}
