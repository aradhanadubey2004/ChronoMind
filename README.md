# ChronoMind AI — Enterprise Temporal Intelligence & Memory Platform

ChronoMind AI is a full-stack, enterprise-grade AI productivity platform designed to synthesize conversation memory, project decision graphs, and cognitive task execution using Google Gemini AI and MongoDB Atlas.

---

## 🌟 Key Capabilities

1. **AI Meeting & Conversation Analyzer**
   - **Executive Summarizer**: Auto-generates structured meeting overviews, key points, and participant roles via `POST /api/v1/ai/summary`.
   - **Decision Mining**: Extracts strategic and technical decision choices, impact scores, and risk levels via `POST /api/v1/ai/decisions`.
   - **Task Synthesizer**: Converts transcripts into actionable tasks with energy-based scheduling recommendations via `POST /api/v1/ai/tasks`.

2. **Long-Term Temporal Memory Engine**
   - Indexes dialogue nodes across projects with metadata tagging, category filtering, and semantic retention controls.

3. **Decision Timeline & Risk Simulator**
   - Visualizes decision lineage and calculates confidence indices for technical and strategic choices.

4. **Cognitive Task Management**
   - Prioritizes workload based on cognitive focus levels (`High Focus`, `Medium Flow`, `Low Energy / Quick`).

5. **Temporal AI Chat Interface**
   - Server-side Gemini API proxy ensuring strict API key isolation from client code.

---

## 🛠 Architecture & Tech Stack

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS with custom MongoDB/ChronoMind dark/light color tokens
- **Icons**: Lucide React
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js + Express.js (MVC Pattern)
- **Database**: MongoDB Atlas with Mongoose ORM (`MONGO_URI`)
- **Authentication**: JWT Auth (`JWT_SECRET`, `JWT_EXPIRE=7d`) with BCrypt password hashing
- **AI Core**: `@google/genai` TypeScript/JavaScript SDK with server-side proxying (`GEMINI_API_KEY`)

---

## 🚀 Environment Variables

Copy `.env.example` to `.env` in both root and `/backend`:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# MongoDB Atlas Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/chronomind?retryWrites=true&w-[#00684A]

# Authentication
JWT_SECRET=your_super_secret_jwt_key_chronomind_2026
JWT_EXPIRE=7d

# Gemini AI API Key (Server-Side ONLY)
GEMINI_API_KEY=your_google_gemini_api_key
```

---

## 📡 API Endpoints

### Authentication Routes (`/api/v1/auth`)
- `POST /register` - User registration
- `POST /login` - JWT Authentication
- `GET /me` - Get current user profile (`Protected`)

### AI Integration Routes (`/api/v1/ai`)
- `POST /summary` - Generate structured meeting summary (`Protected`)
- `POST /decisions` - Extract key decision points (`Protected`)
- `POST /tasks` - Synthesize actionable tasks (`Protected`)

### Memory & Workspace Routes 
- `GET/POST /api/v1/conversations` - Memory management (`Protected`)
- `GET/POST /api/v1/decisions` - Decision timeline (`Protected`)
- `GET/POST /api/v1/tasks` - Task management (`Protected`)
- `GET/POST /api/v1/chat` - Temporal AI chat history (`Protected`)

---

## 🧪 Verification & Build Status

- **TypeScript Compiler**: `tsc --noEmit` — PASSED (0 errors)
- **Production Build**: `npm run build` — PASSED (0 errors)
- **Security Check**: Gemini API keys strictly managed server-side; JWT auth applied across all protected routes.
