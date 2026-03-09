"""
SENTINELA NLP Service
Provides NLP processing: language detection, entity extraction,
thematic classification, sentiment analysis, keyword extraction.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import re
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sentinela-nlp")

app = FastAPI(
    title="SENTINELA NLP Service",
    description="Natural Language Processing pipeline for intelligence content",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Load spaCy model ─────────────────────────────────────────────────────────
try:
    import spacy
    nlp_model = spacy.load("en_core_web_sm")
    logger.info("spaCy model loaded: en_core_web_sm")
except Exception as e:
    nlp_model = None
    logger.warning(f"spaCy not available: {e}")

# ─── Language Detection ───────────────────────────────────────────────────────
try:
    from langdetect import detect as langdetect_detect
    LANGDETECT_AVAILABLE = True
except ImportError:
    LANGDETECT_AVAILABLE = False
    logger.warning("langdetect not available, using heuristics")


def detect_language(text: str) -> str:
    if LANGDETECT_AVAILABLE:
        try:
            return langdetect_detect(text[:1000])
        except Exception:
            pass
    # Heuristic fallback
    if re.search(r'[\u0400-\u04FF]', text):
        return 'ru'
    if re.search(r'[\u4E00-\u9FFF]', text):
        return 'zh'
    if re.search(r'[\u0600-\u06FF]', text):
        return 'ar'
    if re.search(r'[\u0900-\u097F]', text):
        return 'hi'
    return 'en'


# ─── Keyword Extraction ───────────────────────────────────────────────────────
STOPWORDS = {
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'this', 'that', 'these', 'those', 'it', 'its',
    'said', 'according', 'also', 'from', 'as', 'he', 'she', 'they', 'we',
}

def extract_keywords(text: str, top_n: int = 15) -> List[str]:
    words = re.findall(r'\b[a-zA-Z][a-zA-Z-]{2,}\b', text)
    freq: Dict[str, int] = {}
    for word in words:
        lower = word.lower()
        if lower not in STOPWORDS and len(lower) > 3:
            freq[lower] = freq.get(lower, 0) + 1
    sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    return [w for w, _ in sorted_words[:top_n]]


# ─── Domain Classification ────────────────────────────────────────────────────
DOMAIN_KEYWORDS: Dict[str, List[str]] = {
    'geopolitical': [
        'war', 'military', 'diplomatic', 'sanction', 'nato', 'election', 'government',
        'president', 'minister', 'treaty', 'conflict', 'coup', 'protest', 'referendum',
        'ally', 'foreign', 'invasion', 'ceasefire', 'troops', 'missile',
    ],
    'financial': [
        'stock', 'market', 'bank', 'economy', 'gdp', 'inflation', 'currency', 'dollar',
        'euro', 'yuan', 'trade', 'export', 'import', 'investment', 'recession', 'debt',
        'bond', 'commodity', 'oil', 'gold', 'index', 'fed', 'ecb',
    ],
    'regulatory': [
        'law', 'regulation', 'legislation', 'compliance', 'enforcement', 'legal',
        'court', 'ruling', 'fine', 'antitrust', 'gdpr', 'sec', 'fca', 'policy',
        'directive', 'bill', 'act', 'parliament', 'congress', 'decree',
    ],
    'cyber': [
        'hack', 'cyberattack', 'ransomware', 'malware', 'vulnerability', 'breach',
        'cve', 'exploit', 'apt', 'phishing', 'ddos', 'zero-day', 'backdoor',
        'infosec', 'cybersecurity', 'threat actor', 'intrusion', 'espionage',
    ],
    'supply_chain': [
        'supply chain', 'logistics', 'shipping', 'port', 'freight', 'container',
        'disruption', 'shortage', 'manufacturing', 'inventory', 'transport',
        'trade route', 'embargo', 'tariff', 'customs',
    ],
    'narrative': [
        'propaganda', 'disinformation', 'fake news', 'media', 'narrative', 'framing',
        'censorship', 'influence', 'social media', 'campaign', 'manipulation',
        'information war', 'psyop', 'astroturfing',
    ],
}

def classify_domain(text: str, keywords: List[str]) -> str:
    text_lower = text.lower()
    scores: Dict[str, int] = {domain: 0 for domain in DOMAIN_KEYWORDS}
    for domain, domain_kw in DOMAIN_KEYWORDS.items():
        for kw in domain_kw:
            if kw in text_lower:
                scores[domain] += 1
    for kw in keywords:
        for domain, domain_kw in DOMAIN_KEYWORDS.items():
            if kw in domain_kw:
                scores[domain] += 2
    best = max(scores, key=lambda k: scores[k])
    return best if scores[best] > 0 else 'geopolitical'


# ─── Sentiment Analysis ───────────────────────────────────────────────────────
NEGATIVE_WORDS = {
    'attack', 'war', 'crisis', 'conflict', 'threat', 'danger', 'warning', 'collapse',
    'fail', 'destabilize', 'violence', 'terror', 'bomb', 'killed', 'dead', 'hostage',
    'breach', 'hack', 'sanction', 'embargo', 'invasion', 'coup', 'explosion',
}
POSITIVE_WORDS = {
    'peace', 'agreement', 'cooperation', 'deal', 'treaty', 'alliance', 'diplomatic',
    'success', 'resolve', 'solution', 'ceasefire', 'aid', 'recovery', 'growth',
}

def analyze_sentiment(text: str) -> float:
    text_lower = text.lower()
    words = set(re.findall(r'\b\w+\b', text_lower))
    neg = len(words & NEGATIVE_WORDS)
    pos = len(words & POSITIVE_WORDS)
    total = neg + pos
    if total == 0:
        return 0.0
    return round((pos - neg) / total, 3)


# ─── NER ──────────────────────────────────────────────────────────────────────
def extract_entities(text: str) -> List[Dict[str, Any]]:
    entities = []
    if nlp_model:
        try:
            doc = nlp_model(text[:5000])
            seen = set()
            for ent in doc.ents:
                key = (ent.text.strip(), ent.label_)
                if key not in seen and len(ent.text.strip()) > 1:
                    seen.add(key)
                    entities.append({
                        'text': ent.text.strip(),
                        'type': ent.label_,
                        'confidence': 0.85,
                    })
        except Exception as e:
            logger.warning(f"spaCy NER failed: {e}")
    return entities[:30]


def extract_locations(entities: List[Dict]) -> List[Dict]:
    location_types = {'GPE', 'LOC', 'FAC'}
    return [
        {'name': e['text'], 'countryCode': None}
        for e in entities
        if e['type'] in location_types
    ]


def detect_event_type(text: str) -> str:
    text_lower = text.lower()
    if any(w in text_lower for w in ['according to', 'sources say', 'reports indicate']):
        return 'analysis'
    if any(w in text_lower for w in ['official statement', 'announced', 'declared', 'spokesperson']):
        return 'official_statement'
    if any(w in text_lower for w in ['advisory', 'vulnerability', 'cve-', 'patch']):
        return 'advisory'
    if any(w in text_lower for w in ['opinion', 'believes', 'argues', 'suggests']):
        return 'opinion'
    return 'news'


def generate_summary(text: str, max_chars: int = 400) -> str:
    sentences = re.split(r'[.!?]+', text.strip())
    sentences = [s.strip() for s in sentences if len(s.strip()) > 30]
    result = ''
    for s in sentences[:3]:
        if len(result) + len(s) + 2 <= max_chars:
            result += s + '. '
    return result.strip() or text[:max_chars].strip()


# ─── Request/Response Models ──────────────────────────────────────────────────
class ProcessRequest(BaseModel):
    text: str
    language: Optional[str] = None
    options: Optional[Dict[str, bool]] = None


class ProcessResponse(BaseModel):
    language: str
    entities: List[Dict[str, Any]]
    domain: str
    subdomain: Optional[str]
    sentiment: float
    keywords: List[str]
    locations: List[Dict[str, Any]]
    eventType: str
    summary: str


class LanguageDetectRequest(BaseModel):
    text: str


class EntityRequest(BaseModel):
    text: str
    language: Optional[str] = "en"


# ─── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"service": "SENTINELA NLP Service", "version": "1.0.0", "status": "operational"}

@app.get("/health")
def health():
    return {"status": "ok", "spacy": nlp_model is not None, "langdetect": LANGDETECT_AVAILABLE}

@app.post("/api/v1/process", response_model=ProcessResponse)
def process_text(req: ProcessRequest):
    """
    Full NLP pipeline: language detection, NER, classification, sentiment, keywords.
    """
    if not req.text or len(req.text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Text too short")

    text = req.text[:10000]  # Safety limit
    language = req.language or detect_language(text)
    keywords = extract_keywords(text)
    entities = extract_entities(text)
    domain = classify_domain(text, keywords)
    sentiment = analyze_sentiment(text)
    locations = extract_locations(entities)
    event_type = detect_event_type(text)
    summary = generate_summary(text)

    return ProcessResponse(
        language=language,
        entities=entities,
        domain=domain,
        subdomain=None,
        sentiment=sentiment,
        keywords=keywords,
        locations=locations,
        eventType=event_type,
        summary=summary,
    )

@app.post("/api/v1/detect-language")
def detect_lang(req: LanguageDetectRequest):
    return {"language": detect_language(req.text), "confidence": 0.85}

@app.post("/api/v1/entities")
def extract_ner(req: EntityRequest):
    entities = extract_entities(req.text)
    return {"entities": entities, "count": len(entities)}

@app.post("/api/v1/keywords")
def get_keywords(req: ProcessRequest):
    keywords = extract_keywords(req.text)
    return {"keywords": keywords}

@app.post("/api/v1/classify-domain")
def classify(req: ProcessRequest):
    keywords = extract_keywords(req.text)
    domain = classify_domain(req.text, keywords)
    return {"domain": domain, "confidence": 0.75}

@app.post("/api/v1/sentiment")
def sentiment(req: ProcessRequest):
    score = analyze_sentiment(req.text)
    label = "positive" if score > 0.1 else "negative" if score < -0.1 else "neutral"
    return {"sentiment": score, "label": label}

@app.post("/api/v1/summarize")
def summarize(req: ProcessRequest):
    summary = generate_summary(req.text, max_chars=500)
    return {"summary": summary}
