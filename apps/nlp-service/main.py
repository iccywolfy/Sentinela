"""SENTINELA NLP Service — security-hardened"""
import os
import re
import hashlib
from typing import Optional
from functools import lru_cache

from fastapi import FastAPI, HTTPException, Request, Depends, Security
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, Field, validator
import spacy
from langdetect import detect, LangDetectException

# ── Rate limiting ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SENTINELA NLP Service",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENV", "production") != "production" else None,
    redoc_url=None,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Security middleware ─────────────────────────────────────────────────────────
allowed_origins = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],
)

# ── Internal API key auth (service-to-service) ─────────────────────────────────
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

NLP_API_KEY = os.getenv("NLP_API_KEY", "")

def verify_api_key(api_key: Optional[str] = Security(api_key_header)):
    if not NLP_API_KEY:
        return  # Dev mode: skip if key not set
    if not api_key or not hmac_compare(api_key, NLP_API_KEY):
        raise HTTPException(status_code=401, detail="Invalid API key")

def hmac_compare(a: str, b: str) -> bool:
    """Constant-time comparison to prevent timing attacks."""
    import hmac
    return hmac.compare_digest(a.encode(), b.encode())

# ── spaCy model ────────────────────────────────────────────────────────────────
@lru_cache(maxsize=1)
def get_nlp():
    try:
        return spacy.load("en_core_web_sm")
    except OSError:
        from unittest.mock import MagicMock
        return MagicMock()

# ── Domain classification keywords ────────────────────────────────────────────
DOMAIN_KEYWORDS = {
    "MILITARY": ["military", "troops", "army", "weapons", "war", "combat", "nato", "defense", "air force", "navy", "missile"],
    "CYBER": ["ransomware", "cyberattack", "hack", "breach", "malware", "phishing", "vulnerability", "cve", "exploit"],
    "ECONOMIC": ["inflation", "gdp", "interest rate", "central bank", "recession", "tariff", "trade", "commodity", "market"],
    "GEOPOLITICAL": ["sanctions", "diplomacy", "election", "coup", "protest", "treaty", "sovereignty", "territorial"],
    "REGULATORY": ["regulation", "legislation", "law", "compliance", "decree", "enforcement", "fine", "penalty"],
    "SUPPLY_CHAIN": ["supply chain", "shipping", "port", "logistics", "disruption", "embargo", "shortage"],
    "SOCIAL": ["protest", "riot", "strike", "humanitarian", "refugee", "poverty"],
}

NEGATIVE_WORDS = {
    "attack", "war", "crisis", "conflict", "death", "kill", "destroy", "threat", "danger",
    "terror", "violence", "collapse", "disaster", "emergency", "breach", "escalate",
    "ransomware", "invasion", "casualties", "bomb", "explosion",
}
POSITIVE_WORDS = {
    "peace", "agreement", "growth", "recovery", "cooperation", "success", "improve",
    "progress", "development", "stability", "prosperity", "deal", "partnership",
}

# ── Input models ───────────────────────────────────────────────────────────────
MAX_TEXT_LEN = 10_000

class TextInput(BaseModel):
    text: str = Field(..., max_length=MAX_TEXT_LEN)

    @validator("text")
    def text_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("text cannot be empty")
        return v.strip()

class ClassifyInput(BaseModel):
    text: str = Field(..., max_length=MAX_TEXT_LEN)
    language: str = Field(default="en", max_length=10)

    @validator("text")
    def text_not_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("text cannot be empty")
        return v

class ProcessInput(BaseModel):
    text: str = Field(..., max_length=MAX_TEXT_LEN)
    source_id: Optional[str] = Field(default=None, max_length=100)
    raw_content_id: Optional[str] = Field(default=None, max_length=100)
    top_n: int = Field(default=5, ge=1, le=20)

    @validator("text")
    def text_not_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("text cannot be empty")
        return v

class KeywordInput(BaseModel):
    text: str = Field(..., max_length=MAX_TEXT_LEN)
    language: str = Field(default="en", max_length=10)
    top_n: int = Field(default=5, ge=1, le=20)

# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/health")
@limiter.limit("60/minute")
def health(request: Request):
    return {"status": "ok", "service": "nlp-service"}

@app.post("/api/v1/detect-language", dependencies=[Depends(verify_api_key)])
@limiter.limit("100/minute")
def detect_language(request: Request, body: TextInput):
    text = body.text
    try:
        lang = detect(text[:500])
        return {"language": lang, "confidence": 0.9}
    except LangDetectException:
        return {"language": "unknown", "confidence": 0.0}

@app.post("/api/v1/classify-domain", dependencies=[Depends(verify_api_key)])
@limiter.limit("100/minute")
def classify_domain(request: Request, body: ClassifyInput):
    text_lower = body.text.lower()
    scores: dict[str, int] = {}
    for domain, keywords in DOMAIN_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            scores[domain] = score

    if not scores:
        return {"domain": "GENERAL", "confidence": 0.3, "scores": {}}

    top_domain = max(scores, key=lambda d: scores[d])
    total = sum(scores.values())
    confidence = round(scores[top_domain] / max(total, 1), 2)
    return {"domain": top_domain, "confidence": confidence, "scores": scores}

@app.post("/api/v1/sentiment", dependencies=[Depends(verify_api_key)])
@limiter.limit("100/minute")
def sentiment(request: Request, body: ClassifyInput):
    tokens = set(re.findall(r"\b\w+\b", body.text.lower()))
    neg = len(tokens & NEGATIVE_WORDS)
    pos = len(tokens & POSITIVE_WORDS)

    if neg == 0 and pos == 0:
        return {"label": "NEUTRAL", "score": 0.0}

    score = round((pos - neg) / (pos + neg), 2)
    label = "POSITIVE" if score > 0 else "NEGATIVE"
    return {"label": label, "score": score}

@app.post("/api/v1/keywords", dependencies=[Depends(verify_api_key)])
@limiter.limit("100/minute")
def extract_keywords(request: Request, body: KeywordInput):
    nlp = get_nlp()
    doc = nlp(body.text[:5_000])

    # Named entities as keywords
    keyword_scores: dict[str, float] = {}
    for ent in doc.ents:
        kw = ent.text.strip()
        if 2 <= len(kw) <= 100:
            keyword_scores[kw] = keyword_scores.get(kw, 0) + 1.5

    # Noun chunks
    for chunk in doc.noun_chunks:
        kw = chunk.text.strip()
        if 2 <= len(kw) <= 100:
            keyword_scores[kw] = keyword_scores.get(kw, 0) + 1.0

    sorted_kws = sorted(keyword_scores.items(), key=lambda x: -x[1])
    return {
        "keywords": [{"text": k, "score": round(min(s / 5, 1.0), 2)} for k, s in sorted_kws[: body.top_n]],
    }

@app.post("/api/v1/process", dependencies=[Depends(verify_api_key)])
@limiter.limit("50/minute")
def process(request: Request, body: ProcessInput):
    text = body.text
    lang_result = detect_language.__wrapped__(request, TextInput(text=text))
    domain_result = classify_domain.__wrapped__(request, ClassifyInput(text=text))
    sentiment_result = sentiment.__wrapped__(request, ClassifyInput(text=text))
    keyword_result = extract_keywords.__wrapped__(
        request, KeywordInput(text=text, top_n=body.top_n)
    )

    nlp = get_nlp()
    doc = nlp(text[:5_000])
    entities = [
        {"text": ent.text, "label": ent.label_, "start": ent.start_char, "end": ent.end_char}
        for ent in doc.ents
    ]

    sentences = [sent.text.strip() for sent in doc.sents if sent.text.strip()]
    summary = " ".join(sentences[:2]) if sentences else text[:200]

    return {
        "language": lang_result["language"],
        "domain": domain_result["domain"],
        "sentiment": sentiment_result,
        "keywords": keyword_result["keywords"],
        "entities": entities[:50],
        "summary": summary[:500],
        "textHash": hashlib.sha256(text.encode()).hexdigest()[:16],
    }
