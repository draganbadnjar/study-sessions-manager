# Smart Study Session Manager

A full-stack application for tracking and managing study sessions with email-only authentication.

## Tech Stack

- **Backend**: Python FastAPI
- **Frontend**: React with Vite
- **Database**: PostgreSQL
- **Styling**: Tailwind CSS
- **AI Integration**:
  - RAG Chat (Claude API) - In-app study assistant
  - MCP Servers (Study Patterns + Playwright)

## Project Structure

```
Project/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   └── services/
│   ├── tests/                    # Unit & integration tests
│   │   ├── conftest.py           # Test fixtures
│   │   ├── test_schemas.py
│   │   ├── test_user_service.py
│   │   ├── test_session_service.py
│   │   ├── test_auth_router.py
│   │   ├── test_sessions_router.py
│   │   └── test_chat_router.py   # RAG chat endpoint tests
│   ├── pytest.ini                # Pytest configuration
│   ├── requirements.txt
│   ├── .env
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/           # UI components + tests
│   │   │   ├── *.jsx
│   │   │   └── *.test.jsx
│   │   ├── pages/                # Page components + tests
│   │   ├── hooks/                # Custom hooks + tests
│   │   ├── services/             # API service + tests
│   │   ├── context/              # React context + tests
│   │   ├── test/                 # Test setup
│   │   ├── App.jsx
│   │   └── App.test.jsx
│   ├── vitest.config.js          # Vitest configuration
│   ├── package.json
│   ├── .env
│   └── .env.example
├── mcp-servers/
│   └── study-patterns/
│       ├── server.py
│       ├── requirements.txt
│       ├── .env
│       └── venv/
├── .mcp.json
├── CLAUDE.md
└── README.md
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

---

## Setup Instructions

### 1. Database Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE study_sessions_db;

# Exit
\q
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env file with your database credentials:
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/study_sessions_db

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: http://localhost:8000

API Documentation: http://localhost:8000/docs

### 3. Frontend Setup

```bash
# Open a new terminal
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will be available at: http://localhost:5173

---

## Automated Testing

### Backend Unit Tests

The backend includes a comprehensive test suite using **pytest** with **105 tests** achieving **98% code coverage**.

#### Test Structure

```
backend/tests/
├── __init__.py
├── conftest.py              # Test fixtures and database setup
├── test_schemas.py          # Pydantic validation tests (20 tests)
├── test_user_service.py     # UserService unit tests (18 tests)
├── test_session_service.py  # SessionService unit tests (26 tests)
├── test_auth_router.py      # Auth API integration tests (13 tests)
└── test_sessions_router.py  # Sessions API integration tests (22 tests)
```

#### Running Tests

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install test dependencies (if not already installed)
pip install -r requirements.txt

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

# Generate HTML coverage report
pytest --cov=app --cov-report=html
```

#### Test Categories

| Category | File | Tests | Description |
|----------|------|-------|-------------|
| Schema Validation | `test_schemas.py` | 20 | Pydantic model validation rules |
| User Service | `test_user_service.py` | 18 | User CRUD operations |
| Session Service | `test_session_service.py` | 26 | Session CRUD, statistics, streaks |
| Auth API | `test_auth_router.py` | 13 | Login/register endpoints |
| Sessions API | `test_sessions_router.py` | 22 | Session CRUD endpoints |

#### Coverage Report

```
Name                              Stmts   Miss  Cover
---------------------------------------------------------------
app/services/session_service.py      74      0   100%
app/services/user_service.py         23      0   100%
app/routers/auth.py                  28      0   100%
app/routers/sessions.py              28      0   100%
app/routers/users.py                 44      0   100%
app/schemas/*                        60      0   100%
app/models/*                         31      0   100%
---------------------------------------------------------------
TOTAL                               342      6    98%
```

#### Test Database

Tests use an **in-memory SQLite database** instead of PostgreSQL for:

- **Speed**: All 99 tests complete in ~2-3 seconds
- **Isolation**: Each test runs in a clean database
- **Safety**: No impact on development or production data
- **Portability**: No database setup required to run tests

#### Writing New Tests

Example test structure:

```python
# tests/test_example.py
import pytest
from app.services.session_service import SessionService

class TestSessionServiceExample:
    """Test class for SessionService examples."""

    def test_create_session(self, db_session, sample_user):
        """Test creating a new study session."""
        service = SessionService(db_session)
        # ... test implementation
        assert result is not None
```

Available fixtures (defined in `conftest.py`):
- `db_session` - Fresh database session
- `client` - FastAPI test client
- `sample_user` - Pre-created test user
- `sample_session` - Pre-created test session
- `multiple_sessions` - Multiple sessions for stats testing
- `sessions_with_streak` - Sessions for streak testing

### Frontend Unit Tests

The frontend includes a comprehensive test suite using **Vitest** and **React Testing Library** with **174 tests** achieving **97% code coverage**.

#### Test Structure

```
frontend/src/
├── test/
│   └── setup.js                 # Test setup, mocks (fetch, localStorage)
├── components/
│   ├── ChatPanel.test.jsx       # RAG chat interface tests (17 tests)
│   ├── ConfirmDialog.test.jsx   # Dialog UI and button tests (6 tests)
│   ├── SessionForm.test.jsx     # Form validation tests (17 tests)
│   ├── SessionList.test.jsx     # List rendering tests (18 tests)
│   └── StatsPanel.test.jsx      # Statistics display tests (14 tests)
├── context/
│   └── UserContext.test.jsx     # Auth context tests (9 tests)
├── hooks/
│   └── useSessions.test.jsx     # Custom hook tests (21 tests)
├── pages/
│   ├── LoginPage.test.jsx       # Login/register flows (20 tests)
│   └── DashboardPage.test.jsx   # Dashboard integration (16 tests)
├── services/
│   └── api.test.js              # API service tests (17 tests)
└── App.test.jsx                 # App routing tests (12 tests)
```

#### Running Tests

```bash
# Navigate to frontend directory
cd frontend

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

# Generate HTML coverage report
npm test -- --run --coverage --reporter=html
```

#### Test Categories

| Category | File | Tests | Description |
|----------|------|-------|-------------|
| API Service | `api.test.js` | 17 | Fetch calls, error handling |
| User Context | `UserContext.test.jsx` | 9 | Auth state, localStorage persistence |
| Chat Panel | `ChatPanel.test.jsx` | 17 | RAG chat interface, messaging |
| Confirm Dialog | `ConfirmDialog.test.jsx` | 6 | Dialog UI, confirm/cancel actions |
| Session Form | `SessionForm.test.jsx` | 17 | Form validation, create/edit modes |
| Session List | `SessionList.test.jsx` | 18 | List rendering, Edit/Delete buttons |
| Stats Panel | `StatsPanel.test.jsx` | 14 | Statistics display, empty states |
| useSessions Hook | `useSessions.test.jsx` | 21 | CRUD operations, optimistic updates |
| Login Page | `LoginPage.test.jsx` | 20 | Login/register flows, error states |
| Dashboard Page | `DashboardPage.test.jsx` | 16 | Dashboard integration, Add Session |
| App | `App.test.jsx` | 12 | Routing, localStorage persistence |

#### Coverage Report

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

- **Vitest**: Fast, Vite-native test runner with ESM support
- **React Testing Library**: User-centric DOM testing utilities
- **jsdom**: Browser environment simulation
- **@testing-library/user-event**: User interaction simulation
- **Mock fetch**: Global fetch mock for API tests
- **Mock localStorage**: Storage simulation for auth tests

#### Writing New Tests

Example test structure:

```jsx
// src/components/MyComponent.test.jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should handle click', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<MyComponent onClick={onClick} />)
    await user.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalled()
  })
})
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | Email lookup - returns user data if exists |
| POST | /auth/register | Create new user account |
| GET | /users/{user_id}/sessions | Get all sessions for user |
| POST | /users/{user_id}/sessions | Create new session |
| PUT | /sessions/{session_id} | Update session |
| DELETE | /sessions/{session_id} | Delete session |
| GET | /users/{user_id}/stats | Get dashboard statistics |
| POST | /users/{user_id}/chat | RAG chat with AI study assistant |

---

## Phase 4: Integration & Testing

### Complete User Flow Testing

#### 1. Authentication Flow

**Test: New User Registration**
1. Open http://localhost:5173
2. Click "Create Account"
3. Enter a new email (e.g., `test@example.com`)
4. Click "Create Account"
5. **Expected**: User is redirected to dashboard

**Test: Existing User Login**
1. Open http://localhost:5173 (or sign out first)
2. Enter the registered email
3. Click "Sign In"
4. **Expected**: User is redirected to dashboard with their sessions

**Test: Invalid Login**
1. Open http://localhost:5173
2. Enter a non-existent email (e.g., `fake@notreal.com`)
3. Click "Sign In"
4. **Expected**: Error message "User not found. Please check your email address."

#### 2. Dashboard Flow

**Test: View Empty Dashboard**
1. Login with a new user
2. **Expected**: Dashboard shows "No study sessions yet" message
3. **Expected**: Statistics panel shows zeros

#### 3. Add Session

**Test: Create New Session**
1. Click "Add Session" button
2. Fill in:
   - Subject: "Mathematics"
   - Duration: 60
   - Date: Today's date
   - Notes: "Studied calculus chapter 5"
3. Click "Create"
4. **Expected**: Modal closes
5. **Expected**: New session appears in the list
6. **Expected**: Statistics update (1 session, 1 hour)

**Test: Validation**
1. Click "Add Session"
2. Leave subject empty, click "Create"
3. **Expected**: Form validation prevents submission

#### 4. Edit Session

**Test: Update Session**
1. Click "Edit" on an existing session
2. Change subject to "Advanced Mathematics"
3. Change duration to 90
4. Click "Update"
5. **Expected**: Session updates in the list
6. **Expected**: Statistics reflect the change

#### 5. Delete Session

**Test: Delete with Confirmation**
1. Click "Delete" on a session
2. **Expected**: Confirmation dialog appears
3. Click "Cancel"
4. **Expected**: Session is not deleted
5. Click "Delete" again
6. Click "Delete" in confirmation
7. **Expected**: Session is removed from list
8. **Expected**: Statistics update

#### 6. Error Handling

**Test: Network Error Handling**
1. Stop the backend server
2. Try to add a new session
3. **Expected**: Error message appears
4. **Expected**: UI remains functional

---

### API Testing (using curl or API docs)

```bash
# Test health endpoint
curl http://localhost:8000/

# Register a new user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Create a session (replace USER_ID with actual UUID)
curl -X POST http://localhost:8000/users/USER_ID/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Mathematics",
    "duration_minutes": 60,
    "notes": "Test session",
    "session_date": "2025-12-30"
  }'

# Get user sessions
curl http://localhost:8000/users/USER_ID/sessions

# Get user stats
curl http://localhost:8000/users/USER_ID/stats

# Update a session (replace SESSION_ID)
curl -X PUT http://localhost:8000/sessions/SESSION_ID \
  -H "Content-Type: application/json" \
  -d '{"subject": "Physics", "duration_minutes": 90}'

# Delete a session
curl -X DELETE http://localhost:8000/sessions/SESSION_ID
```

---

### Data Validation Testing

| Field | Valid | Invalid |
|-------|-------|---------|
| email | test@example.com | invalid-email |
| subject | "Math" (1-100 chars) | "" (empty) |
| duration_minutes | 1, 60, 120 | 0, -1, empty |
| session_date | 2025-12-30 | invalid-date |
| notes | any text or null | - |

---

### Cross-Browser & Responsiveness Testing

**Browsers to Test:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Responsive Breakpoints:**
- Mobile: 320px - 640px
- Tablet: 641px - 1024px
- Desktop: 1025px+

**Test Checklist:**
- [ ] Login page centers properly on all screen sizes
- [ ] Dashboard layout stacks on mobile (sessions on top, stats below)
- [ ] Session form modal is usable on mobile
- [ ] Delete confirmation dialog is readable
- [ ] All buttons are tappable on touch devices

---

## Troubleshooting Guide

### Backend Issues

**Problem: Database connection failed**
```
sqlalchemy.exc.OperationalError: could not connect to server
```
**Solution:**
1. Verify PostgreSQL is running: `pg_isready`
2. Check database exists: `psql -U postgres -l`
3. Verify credentials in `.env` file
4. Ensure the database URL format is correct

**Problem: Module not found**
```
ModuleNotFoundError: No module named 'app'
```
**Solution:**
1. Ensure you're in the `backend` directory
2. Activate virtual environment
3. Run: `pip install -r requirements.txt`

**Problem: CORS errors**
```
Access to fetch blocked by CORS policy
```
**Solution:**
1. Check `FRONTEND_URL` in backend `.env` matches frontend URL
2. Restart the backend server

---

### Frontend Issues

**Problem: API calls failing**
```
Failed to fetch
```
**Solution:**
1. Verify backend is running on port 8000
2. Check `VITE_API_URL` in frontend `.env`
3. Restart frontend dev server after changing `.env`

**Problem: Blank page / React errors**
**Solution:**
1. Check browser console for errors
2. Clear browser cache
3. Delete `node_modules` and run `npm install` again

**Problem: Styles not loading**
**Solution:**
1. Ensure Tailwind is configured correctly
2. Check `tailwind.config.js` content paths
3. Verify `index.css` has Tailwind directives

---

### Common Issues

**Problem: Changes not reflecting**
**Solution:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear localStorage: `localStorage.clear()`
3. Restart both servers

**Problem: Session persists after logout**
**Solution:**
1. Clear browser localStorage
2. Check UserContext logout function

---

## Definition of Done Checklist

- [x] User can enter email and see their sessions (or get "user not found" error)
- [x] User can add a new session with subject, duration, notes, and date
- [x] User can edit existing sessions
- [x] User can delete existing sessions with confirmation
- [x] Dashboard shows accurate statistics
- [x] Both services run independently and communicate via REST API
- [x] Clean architecture with separated layers
- [x] Input validation and error handling
- [x] Basic logging implemented
- [x] Responsive design (mobile-friendly)
- [x] Loading states for async operations
- [x] MCP Server for AI-powered study pattern analysis
- [x] **RAG Chat feature with Claude API integration**
- [x] **Backend unit tests with 98% code coverage (105 tests)**
- [x] **Frontend unit tests with 97% code coverage (174 tests)**

---

## MCP Server (Study Patterns)

The project includes a Model Context Protocol (MCP) server that allows Claude Code to analyze study patterns directly from the database.

### Features

| Tool | Description |
|------|-------------|
| `lookup_user_by_email` | Get user_id from email address (use this first!) |
| `get_productivity_by_hour` | Analyzes which hours the user studies most |
| `get_neglected_subjects` | Finds subjects not studied recently |
| `get_study_trends` | Daily/weekly patterns, streaks, trajectory |
| `get_subject_distribution` | Time distribution across subjects |
| `get_user_summary` | Complete overview of study habits |

### Setup

```bash
# Navigate to MCP server directory
cd mcp-servers/study-patterns

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env with your database connection:
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/study_sessions_db
```

### Configuration

The MCP server is configured in `.mcp.json` at the project root. Claude Code automatically connects on startup.

### Usage with Claude Code

After setup, ask Claude questions like:
- "Look up user test@example.com" (get user_id from email)
- "When am I most productive?" (provide email or user_id)
- "Which subjects am I neglecting?"
- "Show my study trends for the last 30 days"
- "How is my study time distributed across subjects?"

**Tip:** Use `lookup_user_by_email` tool first to get the user_id, then use it with other analysis tools.

---

## MCP Server (Playwright)

Browser automation for UI testing using Microsoft's official Playwright MCP.

### Features

| Capability | Description |
|------------|-------------|
| Browser Control | Navigate, click, type, scroll |
| Screenshots | Capture visual state for verification |
| Form Automation | Fill inputs, submit forms |
| UI Testing | Automated end-to-end test flows |

### Prerequisites

- Node.js 18+ (already installed for frontend)

### Usage with Claude Code

Ask Claude to test your app:
- "Use playwright mcp to open http://localhost:5173"
- "Test the login flow with email test@mail.com"
- "Add a new study session and verify it appears"
- "Take a screenshot of the dashboard"

### Example Test Scenarios

```
1. Login Test
   - Open http://localhost:5173
   - Enter email in login form
   - Click Sign In
   - Verify dashboard loads

2. Add Session Test
   - Click "Add Session" button
   - Fill subject: "Mathematics"
   - Fill duration: 60
   - Click Create
   - Verify session appears in list

3. Statistics Test
   - Add multiple sessions
   - Verify total hours updates
   - Verify session count is correct
```

---

## RAG Chat Feature

The application includes an AI-powered study assistant that uses RAG (Retrieval-Augmented Generation) to provide personalized advice based on your study data.

### How It Works

1. User clicks the chat bubble icon in the bottom-right corner
2. User asks a question about their studies
3. Backend retrieves user's study data (sessions, stats, subjects)
4. Data is formatted as context for the Claude API
5. Claude generates a personalized, data-aware response
6. Response is displayed in the chat interface

### Setup

1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Add to `backend/.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Restart the backend server

### Features

- **Floating chat panel** - Minimizable interface that doesn't obstruct the dashboard
- **Conversation history** - Context maintained throughout the session
- **Suggested questions** - Quick-start prompts for new users
- **Error handling** - Graceful handling of API errors
- **Context-aware responses** - AI uses your actual study data to provide relevant advice

### Example Questions

- "How am I doing with my studies?"
- "Which subject should I focus on more?"
- "What's my current study streak?"
- "Give me study tips based on my patterns"
- "How many hours have I studied this week?"

### Architecture

```
Backend:
├── app/schemas/chat.py        # Request/Response models
├── app/services/chat_service.py  # RAG logic + Claude API
└── app/routers/chat.py        # POST /users/{user_id}/chat

Frontend:
└── src/components/ChatPanel.jsx  # React chat interface
```
