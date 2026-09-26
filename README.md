# ResolvAI — AI Smart Complaint & Service Management Platform

> A production-ready, full-stack enterprise & municipal service management web application that automates complaint triage, sentiment & urgency scoring, duplicate detection, automated routing, and 24/7 conversational support.

---

## 🌟 Key Highlights & Features

### 1. Multi-Role RBAC & Access Control
- **Citizen / End User**: Submit complaints with file attachments & location, live status tracker with interactive timeline, chat with 24/7 AI bot, rate service resolution (1–5 stars + feedback).
- **Support Agent / Staff**: Assigned tickets queue, **Kanban Board** & table views, status progression workflow (Pending → In Progress → Resolved → Closed), **AI-Suggested Resolution Responses**, audit notes.
- **Department Head / Manager**: Team performance monitoring, SLA compliance rates, ticket reassignments.
- **Admin**: Executive AI Weekly Summary, Recharts visualizations (volume trends, category distribution, sentiment breakdown), department & category management, SLA rules, user role promotions.
- **Authentication**: JWT access & refresh tokens, bcrypt password hashing, **One-Click Google Sign-In**, and instant **Demo Persona Switcher**.

### 2. Built-in AI Intelligence Layer
- **Auto-Categorization Model**: NLP classifier that automatically tags complaints into categories (Water, Road Hazards, Billing, Connectivity, App Glitches, etc.) and routes them to the right municipal department.
- **Sentiment & Urgency Scoring**: Detects distress vs normal tone (-1.0 to 1.0) and assigns priority levels: **Low**, **Medium**, **High**, or **Critical**.
- **Vector Duplicate Detection**: Calculates semantic cosine similarity between ticket embeddings, alerting staff to identical or related local incidents (e.g., 88% similarity match with CMP-2026-1001).
- **24/7 Conversational AI Chatbot**:
  - Persistent floating widget across every page.
  - Natural Language intent detection: File complaint, Check ticket status by ID (`CMP-...`), Knowledge base FAQ RAG, Human escalation.
  - Guided conversational complaint filing: creates tickets directly from chat dialogue with 1-click confirmation!
  - Immediate human handoff on low confidence or request.
- **Smart Auto-Response Suggestions**: Pre-drafts specialized, professional replies for support specialists based on past resolved tickets.

### 3. Sleek Modern Design & Aesthetics
- **Dark & Light Mode Toggle**: Seamless, persistent dark/light theme across every screen.
- **Clean Typography**: Plus Jakarta Sans & Inter font pairing.
- **Glassmorphism & Micro-animations**: Interactive badges, slide-over drawers, real-time toast alerts, and Recharts interactive graphs.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18, v20, or v22+)
- npm (v9+)
- *(Optional)* Docker & Docker Compose

### 1. Clone & Install Dependencies

```bash
# Clone the repository
cd "c:\Users\brahm\New folder (17)"

# Backend setup
cd backend
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed

# Frontend setup
cd ../frontend
npm install
```

### 2. Run the Platform

#### Terminal 1: Backend Server (Port 5000)
```bash
cd backend
npm run dev
```
*API running at `http://localhost:5000`*  
*Swagger OpenAPI Documentation at `http://localhost:5000/api/docs`*

#### Terminal 2: Frontend Client (Port 3000)
```bash
cd frontend
npm run dev
```
*App opens at `http://localhost:3000`*

---

## 🔑 Pre-Seeded Demo Accounts

You can test any role instantly using the **"Demo Persona"** dropdown in the top navigation bar, or log in with these credentials:

| Role | Name | Email | Password |
|---|---|---|---|
| **Admin** | Sarah Vance | `admin@resolvai.gov` | `Password@123` |
| **Dept Head** | David Chen | `manager@resolvai.gov` | `Password@123` |
| **Support Agent** | Marcus Sterling | `agent.works@resolvai.gov` | `Password@123` |
| **Support Agent** | Alex Rivera | `agent.tech@resolvai.gov` | `Password@123` |
| **Support Agent** | Elena Rostova | `agent.billing@resolvai.gov` | `Password@123` |
| **Citizen / User** | John Citizen | `citizen.john@gmail.com` | `Password@123` |
| **Citizen / User** | Maya Patel | `citizen.maya@gmail.com` | `Password@123` |

*Or click **"Sign in with Google Account"** on the login page for instant single-click Google authentication.*

---

## 🐳 Docker Deployment

To launch the full stack in Docker containers:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Swagger Docs: `http://localhost:5000/api/docs`

---

## 📚 API Endpoints Summary

### Authentication (`/api/v1/auth`)
- `POST /register`: Register user
- `POST /login`: Log in with email & password
- `POST /google`: One-click Google account verification
- `POST /refresh-token`: Renew access token
- `GET /profile`: Current user profile & unread notification count

### Complaints (`/api/v1/complaints`)
- `GET /`: List tickets (filters by status, priority, department, mine)
- `POST /`: Submit new ticket (with multipart file attachments & AI triage)
- `POST /check-duplicates`: Real-time semantic duplicate check
- `GET /:id`: Full ticket details, timeline history, attachments, similar tickets
- `PATCH /:id/status`: Transition status (`PENDING` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`)
- `PATCH /:id/assign`: Assign ticket to staff specialist
- `POST /:id/feedback`: Rate resolution (1–5 stars + review comment)

### AI Microservices (`/api/v1/ai`)
- `POST /classify`: NLP categorization & department prediction
- `POST /sentiment`: Sentiment & urgency scoring
- `POST /duplicate-check`: Cosine similarity search over stored vector embeddings
- `POST /suggest-response`: Auto-generate resolution reply draft for agents

### Chatbot Assistant (`/api/v1/chatbot`)
- `POST /message`: Send conversational message, get AI intent & quick action pills
- `GET /history/:sessionToken`: Retrieve chat dialogue session history
- `POST /submit-complaint`: 1-click filing of ticket directly from chat dialogue

### Admin & Analytics (`/api/v1/admin`)
- `GET /analytics`: Volume trends, SLA compliance rate, CSAT, category & sentiment breakdown
- `GET /staff-performance`: Agent resolution speeds and CSAT scores
- `GET /categories`, `POST /categories`: Manage categories & NLP keywords
- `GET /departments`, `POST /departments`: Manage departments
- `GET /users`, `PATCH /users/:id/role`: RBAC user management

---

## 🧪 Testing

Run backend integration test suite:
```bash
cd backend
npm test
```
All tests verify API health, auth, JWT verification, and chatbot NLU intent classification.
