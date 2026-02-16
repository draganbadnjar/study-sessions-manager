const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

async function fetchWithErrorHandling(url, options = {}) {
  try {
    return await fetch(url, options)
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new ApiError(
        'Unable to connect to the server. Please check if the server is running and try again.',
        0
      )
    }
    throw new ApiError(
      'A network error occurred. Please check your internet connection and try again.',
      0
    )
  }
}

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }))
    throw new ApiError(error.detail || 'An error occurred', response.status)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const api = {
  // Auth
  async login(email) {
    const response = await fetchWithErrorHandling(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return handleResponse(response)
  },

  async register(email) {
    const response = await fetchWithErrorHandling(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return handleResponse(response)
  },

  // Sessions
  async getUserSessions(userId) {
    const response = await fetchWithErrorHandling(`${API_URL}/users/${userId}/sessions`)
    return handleResponse(response)
  },

  async createSession(userId, sessionData) {
    const response = await fetchWithErrorHandling(`${API_URL}/users/${userId}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData),
    })
    return handleResponse(response)
  },

  async updateSession(sessionId, sessionData) {
    const response = await fetchWithErrorHandling(`${API_URL}/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData),
    })
    return handleResponse(response)
  },

  async deleteSession(sessionId) {
    const response = await fetchWithErrorHandling(`${API_URL}/sessions/${sessionId}`, {
      method: 'DELETE',
    })
    return handleResponse(response)
  },

  // Stats
  async getUserStats(userId) {
    const response = await fetchWithErrorHandling(`${API_URL}/users/${userId}/stats`)
    return handleResponse(response)
  },

  // Chat
  async sendChatMessage(userId, message, conversationHistory = []) {
    const response = await fetchWithErrorHandling(`${API_URL}/users/${userId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversation_history: conversationHistory,
      }),
    })
    return handleResponse(response)
  },
}

export { ApiError }
