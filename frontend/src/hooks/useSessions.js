import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import { useUser } from '../context/UserContext'

export function useSessions() {
  const { user } = useUser()
  const [sessions, setSessions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const [sessionsData, statsData] = await Promise.all([
        api.getUserSessions(user.id),
        api.getUserStats(user.id),
      ])
      setSessions(sessionsData)
      setStats(statsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const createSession = async (sessionData) => {
    const newSession = await api.createSession(user.id, sessionData)
    setSessions((prev) => [newSession, ...prev])
    await fetchData()
    return newSession
  }

  const updateSession = async (sessionId, sessionData) => {
    const previousSessions = [...sessions]

    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, ...sessionData } : s))
    )

    try {
      const updated = await api.updateSession(sessionId, sessionData)
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? updated : s))
      )
      await fetchData()
      return updated
    } catch (err) {
      setSessions(previousSessions)
      throw err
    }
  }

  const deleteSession = async (sessionId) => {
    const previousSessions = [...sessions]

    setSessions((prev) => prev.filter((s) => s.id !== sessionId))

    try {
      await api.deleteSession(sessionId)
      await fetchData()
    } catch (err) {
      setSessions(previousSessions)
      throw err
    }
  }

  return {
    sessions,
    stats,
    loading,
    error,
    createSession,
    updateSession,
    deleteSession,
    refresh: fetchData,
  }
}
