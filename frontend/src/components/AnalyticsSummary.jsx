export default function AnalyticsSummary({ analytics }) {
  if (!analytics) return <p className="muted">Analytics will appear after responses arrive.</p>;

  return <div className="analytics-stack">
    <div className="stats-grid">
      <Stat label="Total responses" value={analytics.totalResponses} />
      <Stat label="Anonymous" value={analytics.anonymousResponses} />
      <Stat label="Authenticated" value={analytics.authenticatedResponses} />
      <Stat label="Status" value={analytics.status} />
    </div>

    {analytics.questions.map((question) => <article className="question-summary" key={question.id}>
      <div className="summary-head">
        <h3>{question.text}</h3>
        <span>{question.answered} answered · {question.skipped} skipped</span>
      </div>
      {question.options.map((option) => <div className="bar-row" key={option.id}>
        <span>{option.text}</span>
        <div className="bar"><i style={{ width: `${option.percentage}%` }} /></div>
        <strong>{option.count}</strong>
        <small>{option.percentage}%</small>
      </div>)}
    </article>)}

    <section className="recent-box">
      <h3>Recent participation</h3>
      {analytics.recentResponses?.length ? analytics.recentResponses.map((response) => <p key={response.id}>{response.respondent} · {new Date(response.createdAt).toLocaleString()}</p>) : <p className="muted">No responses yet.</p>}
    </section>
  </div>;
}

function Stat({ label, value }) {
  return <div className="stat-card"><strong>{value}</strong><span>{label}</span></div>;
}
