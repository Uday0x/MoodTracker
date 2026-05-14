import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from '../api/client';
import AnalyticsSummary from '../components/AnalyticsSummary';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function Dashboard() {
  const [polls, setPolls] = useState([]);
  const [selected, setSelected] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPolls();
  }, []);

  useEffect(() => {
    if (!selected) return undefined;
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.emit('poll:subscribe', selected.id);
    socket.on('analytics:update', setAnalytics);
    return () => {
      socket.emit('poll:unsubscribe', selected.id);
      socket.disconnect();
    };
  }, [selected]);

  async function loadPolls() {
    try {
      const payload = await api('/polls');
      setPolls(payload.polls);
      if (!selected && payload.polls.length) openAnalytics(payload.polls[0]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function openAnalytics(poll) {
    setSelected(poll);
    setError('');
    try {
      const payload = await api(`/polls/${poll.id}/analytics`);
      setAnalytics(payload.analytics);
    } catch (err) {
      setError(err.message);
    }
  }

  async function publish() {
    if (!selected) return;
    try {
      const payload = await api(`/polls/${selected.id}/publish`, { method: 'POST' });
      setAnalytics(payload.poll.analytics);
      await loadPolls();
    } catch (err) {
      setError(err.message);
    }
  }

  const shareLink = useMemo(() => selected ? `${window.location.origin}/poll/${selected.id}` : '', [selected]);

  return <section className="dashboard-grid">
    <aside className="card poll-sidebar">
      <div className="section-title compact">
        <h1>Your polls</h1>
        <Link className="primary small" to="/create">New</Link>
      </div>
      {error && <div className="alert">{error}</div>}
      {!polls.length && <p className="muted">No polls yet. Create one to start collecting feedback.</p>}
      <div className="poll-list">
        {polls.map((poll) => <button className={`poll-card ${selected?.id === poll.id ? 'selected' : ''}`} key={poll.id} onClick={() => openAnalytics(poll)}>
          <strong>{poll.title}</strong>
          <span>{poll.totalResponses} responses · {poll.status}</span>
          <small>Expires {new Date(poll.expiresAt).toLocaleString()}</small>
        </button>)}
      </div>
    </aside>

    <section className="card analytics-panel">
      {selected ? <>
        <div className="section-title">
          <div>
            <span className={`badge ${analytics?.status || selected.status}`}>{analytics?.status || selected.status}</span>
            <h2>{selected.title}</h2>
            <p>Live analytics update instantly through Socket.io when respondents submit feedback.</p>
          </div>
          <button onClick={publish} disabled={analytics?.published}>Publish final results</button>
        </div>
        <div className="share-box">
          <span>{shareLink}</span>
          <button onClick={() => navigator.clipboard?.writeText(shareLink)}>Copy link</button>
          <Link to={`/poll/${selected.id}`}>Open public form</Link>
        </div>
        <AnalyticsSummary analytics={analytics} />
      </> : <div className="empty-state"><h2>Select a poll</h2><p>Question-wise summaries, option counts and participation insights will appear here.</p></div>}
    </section>
  </section>;
}
