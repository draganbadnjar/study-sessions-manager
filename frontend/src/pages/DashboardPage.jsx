import { useState } from 'react'
import { useUser } from '../context/UserContext'
import { useSessions } from '../hooks/useSessions'
import StatsPanel from '../components/StatsPanel'
import SessionList from '../components/SessionList'
import SessionForm from '../components/SessionForm'
import ConfirmDialog from '../components/ConfirmDialog'
import ChatPanel from '../components/ChatPanel'

function DashboardPage() {
  const { user, logout } = useUser()
  const { sessions, stats, loading, error, createSession, updateSession, deleteSession } = useSessions()
  const [showForm, setShowForm] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [deletingSession, setDeletingSession] = useState(null)
  const [formError, setFormError] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  const handleCreateSession = async (data) => {
    setFormLoading(true)
    setFormError(null)
    try {
      await createSession(data)
      setShowForm(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateSession = async (data) => {
    setFormLoading(true)
    setFormError(null)
    try {
      await updateSession(editingSession.id, data)
      setEditingSession(null)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteSession = async () => {
    try {
      await deleteSession(deletingSession.id)
      setDeletingSession(null)
    } catch (err) {
      setFormError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900">Study Session Manager</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-gray-900">Your Sessions</h2>
              <button
                onClick={() => {
                  setShowForm(true)
                  setFormError(null)
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Session
              </button>
            </div>

            <SessionList
              sessions={sessions}
              onEdit={(session) => {
                setEditingSession(session)
                setFormError(null)
              }}
              onDelete={(session) => setDeletingSession(session)}
            />
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-6">Statistics</h2>
            <StatsPanel stats={stats} />
          </div>
        </div>
      </main>

      {(showForm || editingSession) && (
        <SessionForm
          session={editingSession}
          onSubmit={editingSession ? handleUpdateSession : handleCreateSession}
          onCancel={() => {
            setShowForm(false)
            setEditingSession(null)
            setFormError(null)
          }}
          loading={formLoading}
          error={formError}
        />
      )}

      {deletingSession && (
        <ConfirmDialog
          title="Delete Session"
          message={`Are you sure you want to delete the "${deletingSession.subject}" session? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteSession}
          onCancel={() => setDeletingSession(null)}
        />
      )}

      <ChatPanel />
    </div>
  )
}

export default DashboardPage
