# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Study Session Manager - A full-stack application for tracking study sessions with email-only authentication (no passwords).

## Commands

### Backend (from `/backend` directory)
```bash
# Activate virtual environment (Windows)
venv\Scripts\activate

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Install dependencies
pip install -r requirements.txt
```

### Frontend (from `/frontend` directory)
```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Production build
npm run preview  # Preview production build
npm test         # Run tests in watch mode
npm test -- --run           # Run tests once
npm test -- --run --coverage  # Run with coverage
```

### Database
```bash
# Create database (PostgreSQL)
psql -U postgres -c "CREATE DATABASE study_sessions_db;"
```

## Architecture

### Backend (FastAPI + SQLAlchemy)

**Layered architecture:**
- `routers/` - HTTP endpoints, request/response handling
- `services/` - Business logic (e.g., `SessionService` handles CRUD + statistics calculation)
- `models/` - SQLAlchemy ORM models (User, Session)
- `schemas/` - Pydantic models for validation

**Key patterns:**
- Database sessions via `get_db()` dependency injection
- Tables auto-created on startup via `Base.metadata.create_all()`
- CORS configured for frontend URL from settings
- UUIDs used for all primary keys

**API structure:**
- `/auth/*` - Login/register (email-only)
- `/users/{user_id}/sessions` - User's sessions
- `/users/{user_id}/stats` - Dashboard statistics
- `/users/{user_id}/chat` - RAG chat with AI assistant
- `/sessions/{session_id}` - Session CRUD

### Frontend (React + Vite + Tailwind)

**State management:**
- `UserContext` provides auth state globally
- User persisted to localStorage (`study_session_user` key)
- `useSessions` hook manages session CRUD operations

**Routing:**
- No router library - conditional rendering based on `user` state
- `LoginPage` when logged out, `DashboardPage` when logged in

**API communication:**
- Direct fetch calls to `VITE_API_URL` (default: `http://localhost:8000`)

## Environment Variables

### Backend (`backend/.env`)
- `DATABASE_URL` - PostgreSQL connection string
- `FRONTEND_URL` - For CORS (default: `http://localhost:5173`)
- `ANTHROPIC_API_KEY` - Claude API key for RAG chat feature (optional)

### Frontend (`frontend/.env`)
- `VITE_API_URL` - Backend URL (default: `http://localhost:8000`)

## Testing

### Backend Unit Tests (pytest)

The backend includes a comprehensive test suite using pytest with 105 tests achieving 98% code coverage.

#### Test Structure
```
backend/tests/
├── __init__.py
├── conftest.py              # Test fixtures and database setup
├── test_schemas.py          # Pydantic validation tests
├── test_user_service.py     # UserService unit tests
├── test_session_service.py  # SessionService unit tests
├── test_auth_router.py      # Auth API integration tests
├── test_sessions_router.py  # Sessions API integration tests
└── test_chat_router.py      # Chat API integration tests
```

#### Running Tests (from `/backend` directory)
```bash
# Activate virtual environment
venv\Scripts\activate

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run with coverage report
pytest --cov=app --cov-report=term-missing

# Run specific test file
pytest tests/test_session_service.py

# Run specific test class
pytest tests/test_session_service.py::TestSessionServiceStreak

# Run specific test
pytest tests/test_session_service.py::TestSessionServiceStreak::test_streak_consecutive_days
```

#### Test Categories
| Category | File | Tests | Description |
|----------|------|-------|-------------|
| Schema Validation | `test_schemas.py` | 20 | Pydantic model validation |
| User Service | `test_user_service.py` | 18 | User CRUD operations |
| Session Service | `test_session_service.py` | 26 | Sessions, stats, streaks |
| Auth API | `test_auth_router.py` | 13 | Login/register endpoints |
| Sessions API | `test_sessions_router.py` | 22 | Session CRUD endpoints |
| Chat API | `test_chat_router.py` | 6 | RAG chat endpoints |

#### Test Database
Tests use an in-memory SQLite database (not PostgreSQL) for:
- Fast execution (~2-3 seconds for all tests)
- Complete isolation between tests
- No impact on development/production data

### Frontend Unit Tests (Vitest + React Testing Library)

The frontend includes a comprehensive test suite using Vitest with 174 tests achieving 97% code coverage.

#### Test Structure
```
frontend/src/
├── test/
│   └── setup.js                 # Test setup and mocks
├── components/
│   ├── ChatPanel.test.jsx       # RAG chat interface tests
│   ├── ConfirmDialog.test.jsx   # Dialog component tests
│   ├── SessionForm.test.jsx     # Form validation tests
│   ├── SessionList.test.jsx     # List rendering tests
│   └── StatsPanel.test.jsx      # Statistics display tests
├── context/
│   └── UserContext.test.jsx     # Auth context tests
├── hooks/
│   └── useSessions.test.jsx     # Custom hook tests
├── pages/
│   ├── LoginPage.test.jsx       # Login flow tests
│   └── DashboardPage.test.jsx   # Dashboard integration tests
├── services/
│   └── api.test.js              # API service tests
└── App.test.jsx                 # App routing tests
```

#### Running Tests (from `/frontend` directory)
```bash
# Run all tests in watch mode
npm test

# Run all tests once
npm test -- --run

# Run with coverage report
npm test -- --run --coverage

# Run specific test file
npm test -- --run src/components/SessionList.test.jsx

# Run tests matching pattern
npm test -- --run -t "SessionList"
```

#### Test Categories
| Category | File | Tests | Description |
|----------|------|-------|-------------|
| API Service | `api.test.js` | 17 | Fetch calls, error handling |
| User Context | `UserContext.test.jsx` | 9 | Auth state, localStorage |
| Chat Panel | `ChatPanel.test.jsx` | 17 | RAG chat interface |
| Confirm Dialog | `ConfirmDialog.test.jsx` | 6 | Dialog UI, button actions |
| Session Form | `SessionForm.test.jsx` | 17 | Form validation, submit |
| Session List | `SessionList.test.jsx` | 18 | List rendering, actions |
| Stats Panel | `StatsPanel.test.jsx` | 14 | Statistics display |
| useSessions Hook | `useSessions.test.jsx` | 21 | CRUD operations |
| Login Page | `LoginPage.test.jsx` | 20 | Login/register flows |
| Dashboard Page | `DashboardPage.test.jsx` | 16 | Dashboard integration |
| App | `App.test.jsx` | 12 | Routing, persistence |

#### Coverage Summary
```
File               | % Stmts | % Branch | % Funcs | % Lines |
-------------------|---------|----------|---------|---------|
All files          |   96.56 |    94.85 |   89.13 |   96.56 |
 App.jsx           |     100 |      100 |     100 |     100 |
 components/       |     100 |    93.18 |     100 |     100 |
 context/          |     100 |      100 |     100 |     100 |
 hooks/            |     100 |      100 |     100 |     100 |
 pages/            |   89.55 |    93.33 |   61.53 |   89.55 |
 services/         |     100 |    90.47 |     100 |     100 |
```

#### Test Environment
- **Vitest**: Fast test runner with native ESM support
- **React Testing Library**: DOM testing utilities
- **jsdom**: Browser environment simulation
- **Mock fetch**: Global fetch mock for API tests
- **Mock localStorage**: Persistent storage simulation

## MCP Server (Study Patterns)

An MCP server has been implemented to allow Claude to analyze study patterns directly.

### Location
```
mcp-servers/study-patterns/
├── server.py          # MCP server with 5 analysis tools
├── requirements.txt   # Dependencies
├── .env               # Database connection
└── venv/              # Virtual environment
```

### Setup Commands
```bash
cd mcp-servers/study-patterns
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Available MCP Tools
| Tool | Description |
|------|-------------|
| `lookup_user_by_email` | Get user_id from email address (use this first!) |
| `get_productivity_by_hour` | Analyzes which hours user studies most |
| `get_neglected_subjects` | Finds subjects not studied recently |
| `get_study_trends` | Daily/weekly patterns, streaks, trajectory |
| `get_subject_distribution` | Time distribution across subjects |
| `get_user_summary` | Complete overview of study habits |

### Configuration
The MCP is configured in `.mcp.json` at project root. Claude Code will auto-connect on startup.

### Usage
After restarting Claude Code, ask questions like:
- "Look up user test@example.com" (get user_id from email)
- "When am I most productive?" (provide email or user_id)
- "Which subjects am I neglecting?"
- "Show my study trends"
- "How is my time distributed across subjects?"

**Note:** Use `lookup_user_by_email` first to get the user_id, then use it with other tools.

## MCP Server (Playwright)

Browser automation MCP for UI testing and web interaction.

### Features
- Automate browser interactions (click, type, navigate)
- Take screenshots for visual verification
- Test the web app UI automatically
- Fill forms, submit data, verify results

### Usage
Say "use playwright mcp" explicitly the first time:
- "Use playwright mcp to open http://localhost:5173"
- "Use playwright to test the login flow"
- "Take a screenshot of the dashboard"
- "Fill in the login form with test@mail.com and submit"

### Test Scenarios for Study Session Manager
1. **Login Flow**: Open app → Enter email → Verify dashboard loads
2. **Add Session**: Click Add → Fill form → Submit → Verify session appears
3. **Edit Session**: Click Edit → Modify fields → Save → Verify changes
4. **Delete Session**: Click Delete → Confirm → Verify removal
5. **Statistics**: Add sessions → Verify stats update correctly

## RAG Chat Feature

The application includes an AI-powered study assistant that uses RAG (Retrieval-Augmented Generation) to answer questions about the user's study patterns.

### How It Works
1. User asks a question via the chat interface
2. Backend retrieves user's study data (sessions, stats, subjects)
3. Data is formatted as context for the LLM
4. Claude API generates a personalized response
5. Response is displayed in the chat UI

### Setup
1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Add to `backend/.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Restart the backend server

### Backend Components
```
backend/app/
├── schemas/chat.py        # ChatRequest, ChatResponse, ChatMessage
├── services/chat_service.py  # RAG logic and Claude API integration
└── routers/chat.py        # POST /users/{user_id}/chat endpoint
```

### Frontend Components
```
frontend/src/
└── components/ChatPanel.jsx  # Floating chat interface
```

### Usage
- Click the chat bubble icon in the bottom-right corner
- Ask questions like:
  - "How am I doing with my studies?"
  - "Which subject should I focus on more?"
  - "What's my study streak?"
  - "Give me study tips based on my patterns"

### Features
- Floating chat panel that can be minimized
- Conversation history maintained during session
- Suggested questions for new users
- Loading indicators and error handling
- Context-aware responses based on actual study data
