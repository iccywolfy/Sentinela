# SENTINELA — Global Intelligence Fusion Platform

> **Version:** 1.0.0 · **Classification:** UNCLASSIFIED / PUBLIC

SENTINELA is an enterprise-grade open-source intelligence (OSINT) and geopolitical risk platform designed for intelligence analysts, strategic advisors, and executive decision-makers. It fuses multi-source data ingestion, AI-assisted correlation, narrative divergence analysis, and automated alerting into a unified operational picture.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Modules](#modules)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Quick Start (Docker Compose)](#quick-start-docker-compose)
- [Development Setup](#development-setup)
- [Production Deployment (Kubernetes / Helm)](#production-deployment-kubernetes--helm)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [CI/CD](#cicd)
- [Default Credentials](#default-credentials)

---

## Architecture Overview

```
                         ┌─────────────────────────────────────┐
                         │           SENTINELA Platform         │
                         └─────────────────────────────────────┘

 ┌──────────────┐    ┌──────────────────┐    ┌────────────────────────┐
 │   Frontend   │───▶│   API Gateway    │───▶│  Ingestion Service     │
 │  React 18    │    │  NestJS :3000    │    │  NestJS :3001          │
 │  Vite + TW   │    │  JWT Auth        │    │  RSS/REST/Crawl/Upload │
 └──────────────┘    │  Risk Scoring    │    │  BullMQ Pipeline       │
                     │  Workspace       │    │  Event Normalization   │
                     │  Dashboard       │    └───────────┬────────────┘
                     └────────┬─────────┘               │
                              │                         ▼
 ┌──────────────────────┐     │           ┌─────────────────────────┐
 │  Correlation Service │◀────┘           │     Elasticsearch       │
 │  NestJS :3002        │                 │     (Event Index)       │
 │  8 Correlation types │                 └─────────────────────────┘
 │  Narrative Intel     │
 │  9 Media Blocs       │     ┌───────────────────────┐
 └──────────────────────┘     │    Alert Service      │
                              │    NestJS :3003        │
 ┌──────────────────────┐     │    9 Alert Types       │
 │  Report Service      │     │    Watchlists          │
 │  NestJS :3004        │     │    Noise Suppressor    │
 │  11 Report Types     │     └───────────────────────┘
 │  Puppeteer PDF       │
 │  MinIO/S3 Storage    │     ┌───────────────────────┐
 └──────────────────────┘     │    NLP Service        │
                              │    Python FastAPI :8000│
                              │    NER, Sentiment      │
                              │    Lang Detection      │
                              └───────────────────────┘

Infrastructure: PostgreSQL · Elasticsearch · Redis · Kafka · MinIO · Keycloak
Observability:  Prometheus · Grafana
```

---

## Modules

### M1 — Data Source Fabric
Manages the lifecycle of intelligence sources with full metadata tracking.

- **Source types:** News media, government portals, think tanks, academic, social media, financial, intelligence feeds
- **Collection methods:** RSS Feed, REST API, Web Crawl, Manual Upload, URL Watchlist
- **Features:** Credibility scoring (EMA-based), health monitoring, MD5 deduplication, configurable polling frequency
- **Connectors:** RSS/Atom, authenticated REST APIs, CSS-selector web crawler

### M2 — Ingestion Pipeline
Fully automated 7-stage processing pipeline via BullMQ queues.

| Stage | Description |
|-------|-------------|
| 1. Validation | Schema and content validation |
| 2. Deduplication | MD5 hash-based content dedup |
| 3. Language Detection | Unicode heuristics + langdetect |
| 4. NLP Enrichment | NER, sentiment, domain classification via NLP service |
| 5. Normalization | Maps raw content to unified event schema |
| 6. Dual Indexing | Writes to PostgreSQL (persistent) + Elasticsearch (searchable) |
| 7. Completion | Updates source metrics, emits Kafka event |

**Reliability:** 3 retries with exponential backoff, dead-letter queue, per-tenant isolation.

### M3 — Event Normalization
Transforms heterogeneous raw content into a unified **NormalizedEvent** schema with 50+ fields.

Key fields: `event_id`, `headline`, `event_domain`, `classification_type`, `impact_score`, `credibility_score`, `urgency_score`, `primary_location`, `actors`, `entities`, `sector_tags`, `provenance_chain`, `language`, `sentiment`, `keywords`.

**Event Domains:** GEOPOLITICAL · ECONOMIC · MILITARY · CYBER · HUMANITARIAN · ENVIRONMENTAL · SOCIAL · TECHNOLOGICAL

### M4 — Correlation Engine
Identifies relationships between events across domains and time using 6 strategies:

| Strategy | Logic |
|----------|-------|
| Temporal | Events within 72-hour window, cross-domain |
| Geographic | Shared country codes |
| Entity-based | Shared actors or organizations (set intersection) |
| Thematic | Shared tags (≥2 overlap) |
| Rule-based | Database-driven configurable conditions |
| Cross-domain | 10 hardcoded geopolitical patterns (e.g., energy→sanctions, cyber→financial) |

Correlations are scored by strength (0–1) and stored with rationale, evidence list, and alternative hypotheses.

### M5 — Narrative Intelligence
Monitors information ecosystems across 9 media blocs and detects narrative divergence.

**Media Blocs:**
`WEST_MEDIA` · `RU_STATE` · `CN_STATE` · `MENA_REGIONAL` · `LATAM_MEDIA` · `GOV_OFFICIAL` · `THINK_TANK` · `TECH_SCIENTIFIC` · `INDEPENDENT`

- **Divergence Index** (0–100): Measures narrative polarization across blocs based on sentiment range and framing diversity
- **Framing Analysis:** Bloc-specific bias maps and sentiment baselines per domain
- **Polarized Terms:** Detects terms with highest cross-bloc divergence
- **Coverage Gaps:** Identifies topics covered by some blocs but ignored by others

### M6 — Risk Scoring
Multi-dimensional event risk scoring with full explainability.

**13 Scoring Factors:**
`impact`, `urgency`, `credibility`, `geopoliticalInstability`, `economicImpact`, `militaryActivity`, `cyberThreat`, `humanitarianCrisis`, `environmentalRisk`, `socialUnrest`, `technologicalDisruption`, `novelty`, `corroboration`

- Weights are configurable per tenant
- Score history with model versioning for drift detection
- Country Risk Scorecards aggregated from per-event scores
- Natural language explainability: top-5 factor decomposition

### M7 — Alerting & Watchlists
Real-time alerting with intelligent noise suppression.

**Alert Types:**
`THRESHOLD_BREACH` · `WATCHLIST_MATCH` · `CORRELATION_DETECTED` · `NARRATIVE_SHIFT` · `CRISIS_ESCALATION` · `SOURCE_ANOMALY` · `ENTITY_ACTIVITY` · `GEOGRAPHIC_ALERT` · `PATTERN_MATCH`

**Watchlist Types:**
`ENTITY` · `COUNTRY` · `KEYWORD` · `TOPIC` · `SECTOR` · `COMPOUND`

**Noise Suppressor (Redis-backed):**
- Per-alert cooldown windows
- Content-based deduplication with configurable TTL
- Feedback loop for analyst-driven suppression tuning

### M8 — Investigative Workspace
Collaborative investigative case management environment.

- **Case lifecycle:** OPEN → IN_PROGRESS → PENDING_REVIEW → CLOSED → ARCHIVED
- **Evidence linking:** Events, notes, attachments per case
- **Semantic search:** Full-text + fuzzy matching via Elasticsearch with highlighted excerpts
- **Entity pivot:** All events linked to a given actor/organization/country
- **Collections:** Curated event sets
- **Dossiers:** Compiled case summaries
- **Investigative Timelines:** Chronological event reconstruction

### M9 — Executive Layer
Strategic decision-support tools for leadership.

- **Global Command Dashboard:** Live KPIs, top risk events, alert feed, domain breakdown, country risk heatmap
- **Daily Intelligence Brief:** AI-assisted per-domain narrative summary
- **Crisis Room:** Escalating event tracking, scenario projections (3 scenarios with probability estimates)

### M10 — Report Studio
Professional intelligence report generation with PDF export.

**11 Report Types:**
`FLASH_ALERT` · `DAILY_BRIEF` · `WEEKLY_DIGEST` · `COUNTRY_RISK_DOSSIER` · `ENTITY_PROFILE` · `THREAT_ASSESSMENT` · `INCIDENT_REPORT` · `NARRATIVE_ANALYSIS` · `CORRELATION_REPORT` · `EXECUTIVE_SUMMARY` · `CUSTOM`

- Sections: Executive Summary, Analysis, Methodology, Conclusion, Appendix (provenance chain)
- PDF rendered via Puppeteer with branded dark navy/gold layout
- Configurable branding per tenant (logo, color scheme, header/footer)
- Lifecycle: DRAFT → GENERATING → READY → APPROVED → PUBLISHED
- Storage on MinIO/S3 with presigned download URLs

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, TanStack Query, Zustand |
| Backend | NestJS (TypeScript), Prisma ORM, PassportJS (JWT) |
| NLP | Python 3.11, FastAPI, spaCy, langdetect |
| Database | PostgreSQL 16 |
| Search | Elasticsearch 8.13 |
| Queue | BullMQ + Redis 7 |
| Messaging | Apache Kafka (Confluent) |
| Object Storage | MinIO (S3-compatible) |
| Auth | Keycloak 24 + JWT |
| PDF | Puppeteer + Handlebars |
| Observability | Prometheus + Grafana |
| Infra (dev) | Docker Compose |
| Infra (prod) | Kubernetes + Helm 3 |
| CI/CD | GitHub Actions |
| Monorepo | Turborepo |

---

## Repository Structure

```
sentinela/
├── apps/
│   ├── frontend/               # React 18 + Vite SPA
│   ├── api-gateway/            # NestJS — Auth, Scoring, Workspace, Executive (M6, M8, M9)
│   ├── ingestion-service/      # NestJS — Sources, Pipeline, Normalization (M1, M2, M3)
│   ├── correlation-service/    # NestJS — Correlation, Narrative (M4, M5)
│   ├── alert-service/          # NestJS — Alerting, Watchlists (M7)
│   ├── report-service/         # NestJS — PDF Reports, Storage (M10)
│   └── nlp-service/            # Python FastAPI — NER, Sentiment, Classification
├── packages/
│   ├── types/                  # Shared TypeScript interfaces (all 10 modules)
│   ├── database/               # Prisma schema + migrations (25+ models)
│   └── ui/                     # Shared design system base
├── infra/
│   ├── helm/sentinela/         # Helm chart (Chart.yaml, values.yaml, templates/)
│   ├── prometheus/             # Prometheus scrape config
│   ├── grafana/dashboards/     # Grafana dashboard provisioning
│   └── keycloak/               # Keycloak realm config with roles and dev users
├── .github/workflows/
│   ├── ci.yml                  # PR: lint, build, test, docker build
│   └── deploy.yml              # main/tag: GHCR push + helm upgrade
├── docker-compose.yml          # Full local dev stack
├── turbo.json                  # Turborepo pipeline config
└── package.json                # Monorepo root (workspaces)
```

---

## Quick Start (Docker Compose)

### Prerequisites
- Docker ≥ 24 and Docker Compose v2
- 8 GB RAM minimum (Elasticsearch requires at least 1 GB heap)

### 1. Clone and configure

```bash
git clone https://github.com/iccywolfy/Sentinela.git
cd Sentinela
cp .env.example .env
# Edit .env to set JWT_SECRET and other secrets for your environment
```

### 2. Start the full stack

```bash
docker compose up -d
```

This starts all 17 services. First startup takes ~3–5 minutes while images are pulled and Elasticsearch initialises.

### 3. Verify services

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost:5173 | React SPA |
| API Gateway | http://localhost:3000 | REST API |
| Ingestion | http://localhost:3001/health | |
| Correlation | http://localhost:3002/health | |
| Alert | http://localhost:3003/health | |
| Report | http://localhost:3004/health | |
| NLP | http://localhost:8000/health | |
| Keycloak | http://localhost:8080 | admin / admin |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| Prometheus | http://localhost:9090 | |
| Grafana | http://localhost:3100 | admin / sentinela |
| Elasticsearch | http://localhost:9200 | |

### 4. Log in

Open http://localhost:5173 and sign in with:

```
Email:    analyst@sentinela.local
Password: sentinela
```

### 5. Add your first source

Navigate to **Sources → Add Source** and add an RSS feed, e.g.:

```
Name:    Reuters World News
URL:     https://feeds.reuters.com/reuters/worldNews
Method:  RSS_FEED
Category: NEWS_MEDIA
Credibility: 0.85
Frequency: 30 (minutes)
```

Events will begin appearing in the Explorer within one collection cycle.

---

## Development Setup

### Prerequisites
- Node.js 20+
- npm 10+
- Python 3.11+ (for nlp-service)

### Install dependencies

```bash
npm install
```

### Generate Prisma client

```bash
npx prisma generate --schema=packages/database/prisma/schema.prisma
```

### Start infrastructure only

```bash
docker compose up -d postgres elasticsearch redis kafka zookeeper minio keycloak
```

### Run all services in dev mode

```bash
# All services with hot reload
npm run dev

# Or individual services
npm run dev --workspace=apps/api-gateway
npm run dev --workspace=apps/ingestion-service
npm run dev --workspace=apps/frontend
```

### Run database migrations

```bash
DATABASE_URL="postgresql://sentinela:sentinela@localhost:5432/sentinela" \
  npx prisma migrate dev --schema=packages/database/prisma/schema.prisma
```

### Run tests

```bash
npm run test
# or with turbo
npx turbo run test
```

---

## Production Deployment (Kubernetes / Helm)

### Prerequisites
- Kubernetes cluster (1.27+)
- Helm 3.14+
- `kubectl` configured for your cluster
- GHCR credentials (or your own registry)

### Add required secrets

```bash
kubectl create namespace sentinela

kubectl create secret generic sentinela-secrets \
  --namespace sentinela \
  --from-literal=database-url="postgresql://sentinela:STRONG_PASS@sentinela-postgresql:5432/sentinela" \
  --from-literal=jwt-secret="$(openssl rand -hex 32)" \
  --from-literal=minio-access-key="sentinela" \
  --from-literal=minio-secret-key="$(openssl rand -hex 24)"
```

### Install with Helm

```bash
helm upgrade --install sentinela ./infra/helm/sentinela \
  --namespace sentinela \
  --create-namespace \
  --set global.imageTag=1.0.0 \
  --set apiGateway.ingress.host=api.your-domain.com \
  --set frontend.ingress.host=sentinela.your-domain.com \
  --wait
```

### Production overrides (values-prod.yaml)

```yaml
global:
  imageTag: "1.0.0"

apiGateway:
  replicaCount: 3
  ingress:
    enabled: true
    host: api.your-domain.com
    tls: true

frontend:
  replicaCount: 2
  ingress:
    enabled: true
    host: sentinela.your-domain.com
    tls: true

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10

networkPolicy:
  enabled: true
```

```bash
helm upgrade --install sentinela ./infra/helm/sentinela \
  --namespace sentinela \
  -f values-prod.yaml
```

---

## API Reference

All endpoints are prefixed with `/api/v1` and require a `Bearer` JWT token except `/api/v1/auth/login`.

### Authentication

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "analyst@sentinela.local", "password": "sentinela" }
```

### Events

```http
GET  /api/v1/events?query=ukraine&domain=GEOPOLITICAL&minScore=0.7&page=1&limit=20
GET  /api/v1/events/:id
```

### Risk Scoring

```http
GET  /api/v1/scoring/country-scoreboard
GET  /api/v1/scoring/:eventId/explain
```

### Alerts

```http
GET  /api/v1/alerts?status=ACTIVE&severity=CRITICAL
POST /api/v1/alerts/:id/acknowledge
POST /api/v1/alerts/:id/resolve
```

### Workspace

```http
GET  /api/v1/workspace/cases
POST /api/v1/workspace/cases
GET  /api/v1/workspace/cases/:id
POST /api/v1/workspace/cases/:id/events
POST /api/v1/workspace/cases/:id/notes
GET  /api/v1/workspace/search?q=entity+name
```

### Reports

```http
GET  /api/v1/reports
POST /api/v1/reports/generate
GET  /api/v1/reports/:id
POST /api/v1/reports/:id/approve
POST /api/v1/reports/:id/publish
```

### Narrative

```http
GET  /api/v1/narrative/profile/latest
GET  /api/v1/narrative/divergence
```

### Sources

```http
GET  /api/v1/sources
POST /api/v1/sources
POST /api/v1/sources/:id/collect
```

### Executive

```http
GET  /api/v1/executive/dashboard/overview
GET  /api/v1/executive/dashboard/brief
GET  /api/v1/executive/crisis-room
GET  /api/v1/executive/crisis-room/scenarios
```

---

## Configuration

All services are configured via environment variables. See `.env.example` for the full list.

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://sentinela:sentinela@postgres:5432/sentinela` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379` |
| `KAFKA_BROKERS` | Kafka broker list | `kafka:9092` |
| `ELASTICSEARCH_URL` | Elasticsearch URL | `http://elasticsearch:9200` |
| `S3_ENDPOINT` | MinIO/S3 endpoint | `http://minio:9000` |
| `S3_ACCESS_KEY` | S3 access key | `minioadmin` |
| `S3_SECRET_KEY` | S3 secret key | `minioadmin` |
| `S3_BUCKET` | S3 bucket name | `sentinela` |
| `JWT_SECRET` | JWT signing secret | **CHANGE IN PRODUCTION** |
| `NLP_SERVICE_URL` | NLP service URL | `http://nlp-service:8000` |
| `NODE_ENV` | Node environment | `development` |

### Multi-tenancy

SENTINELA supports multiple isolated tenants. All data (events, alerts, cases, reports, sources) is scoped by `tenantId`. Each request requires `x-tenant-id` and `x-user-id` headers (injected automatically by the frontend after login).

---

## CI/CD

### Continuous Integration (`ci.yml`)

Triggered on every push to `main`/`develop` and all pull requests:

1. **Lint** — ESLint across all TypeScript apps
2. **Build** — Turborepo builds packages then apps
3. **Test** — Unit tests with live PostgreSQL + Redis service containers
4. **Docker Build** — Validates all 7 Docker images build cleanly (no push)

### Continuous Deployment (`deploy.yml`)

Triggered on push to `main` or version tags (`v*`):

1. **Build & Push** — Builds all 7 Docker images and pushes to GHCR (`ghcr.io/iccywolfy/sentinela/*`)
2. **Helm Upgrade** — Deploys to Kubernetes cluster on version tags only (requires `KUBECONFIG` secret)

**Required GitHub Secrets for CD:**

| Secret | Description |
|--------|-------------|
| `KUBECONFIG` | Kubernetes cluster kubeconfig |
| `JWT_SECRET` | Production JWT signing secret |
| `POSTGRES_PASSWORD` | Production PostgreSQL password |
| `MINIO_PASSWORD` | Production MinIO password |

---

## Default Credentials

> **These are development defaults. Change all secrets before any production use.**

| Service | Username | Password |
|---------|----------|----------|
| SENTINELA App | `analyst@sentinela.local` | `sentinela` |
| SENTINELA Admin | `admin@sentinela.local` | `sentinela` |
| Keycloak Admin | `admin` | `admin` |
| PostgreSQL | `sentinela` | `sentinela` |
| MinIO | `minioadmin` | `minioadmin` |
| Grafana | `admin` | `sentinela` |

---

## License

Copyright © 2024 SENTINELA Team. All rights reserved.

---

*SENTINELA — See everything. Understand everything. Act decisively.*
