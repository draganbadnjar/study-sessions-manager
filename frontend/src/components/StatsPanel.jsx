function formatDuration(minutes) {
  if (minutes === 0) return '0min'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

function StatsPanel({ stats }) {
  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">No statistics available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-semibold text-gray-900">{stats.total_sessions}</p>
            <p className="text-sm text-gray-500">Total Sessions</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-gray-900">{formatDuration(stats.total_minutes)}</p>
            <p className="text-sm text-gray-500">Total Time</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-gray-900">{stats.sessions_this_week}</p>
            <p className="text-sm text-gray-500">This Week</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-indigo-600">{stats.study_streak}</p>
            <p className="text-sm text-gray-500">Day Streak</p>
          </div>
        </div>
      </div>

      {stats.sessions_by_subject && stats.sessions_by_subject.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">By Subject</h3>
          <div className="space-y-3">
            {stats.sessions_by_subject.map((subject) => (
              <div key={subject.subject} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{subject.subject}</span>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {subject.total_sessions} sessions
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({formatDuration(subject.total_minutes)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StatsPanel
