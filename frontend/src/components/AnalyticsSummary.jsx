export default function AnalyticsSummary({ analytics }) {
  if (!analytics) {
    return (
      <div className="bg-white dark:bg-dark-800 p-8 rounded-xl border border-slate-200 dark:border-dark-700 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          Analytics will appear after responses arrive.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Responses" value={analytics.totalResponses} />
        <StatCard label="Anonymous" value={analytics.anonymousResponses} />
        <StatCard label="Authenticated" value={analytics.authenticatedResponses} />
        <StatCard label="Response Rate" value={`${Math.round((analytics.totalResponses / Math.max(analytics.totalResponses + 1, 1)) * 100)}%`} />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {analytics.questions?.map((question, idx) => (
          <div key={idx} className="bg-white dark:bg-dark-800 rounded-xl border border-slate-200 dark:border-dark-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-dark-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">{question.text}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                {question.answered} answered · {question.skipped} skipped
              </p>
            </div>
            <div className="p-6 space-y-4">
              {question.options?.map((option, oIdx) => (
                <div key={oIdx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {option.text}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {option.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-dark-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-slate-900 dark:bg-white h-full transition-all duration-500"
                      style={{ width: `${option.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {option.count} response{option.count !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Responses */}
      {analytics.recentResponses?.length > 0 && (
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-slate-200 dark:border-dark-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-dark-700">
            <h3 className="font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {analytics.recentResponses.map(response => (
                <div
                  key={response.id}
                  className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-slate-50 dark:bg-dark-700"
                >
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{response.respondent}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs">
                    {new Date(response.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg p-4 border border-slate-200 dark:border-dark-700">
      <p className="text-xs uppercase tracking-wide font-semibold text-slate-600 dark:text-slate-400 mb-2">
        {label}
      </p>
      <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
