import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { apiGet, apiPost } from '../api/client';
import AnalyticsSummary from '../components/AnalyticsSummary';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export default function Dashboard() {
  const [polls, setPolls] = useState([]);
  const [selected, setSelected] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    loadPolls();
  }, []);

  // Socket.io connection for live updates
  useEffect(() => {
    if (!selected) return;

    const socket = io(SOCKET_URL, { 
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });
    socket.emit('poll:subscribe', selected.id);
    socket.on('analytics:update', setAnalytics);
    socket.on('error', (err) => setError(`Socket error: ${err}`));

    return () => {
      socket.emit('poll:unsubscribe', selected.id);
      socket.disconnect();
    };
  }, [selected]);

  const loadPolls = async () => {
    try {
      setLoading(true);
      const payload = await apiGet('/polls');
      setPolls(payload.polls || []);
      if (!selected && payload.polls?.length) {
        openAnalytics(payload.polls[0]);
      }
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openAnalytics = async (poll) => {
    try {
      setSelected(poll);
      const payload = await apiGet(`/polls/${poll.id}/analytics`);
      setAnalytics(payload.analytics);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePublish = async () => {
    if (!selected) return;
    setPublishing(true);
    try {
      const payload = await apiPost(`/polls/${selected.id}/publish`, {});
      setAnalytics(payload.poll.analytics);
      await loadPolls();
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const shareLink = useMemo(
    () => (selected ? `${window.location.origin}/poll/${selected.id}` : ''),
    [selected]
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white">Polls</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">Manage and analyze your polls in real-time</p>
        </div>
        <Link
          to="/create"
          className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-semibold hover:shadow-lg transition-all text-lg"
        >
          New Poll
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar - Poll List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-slate-200 dark:border-dark-700 sticky top-24">
            <div className="p-4 border-b border-slate-200 dark:border-dark-700 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white">Your Polls</h2>
            </div>

            {loading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-lg bg-slate-100 dark:bg-dark-700 animate-pulse"></div>
                ))}
              </div>
            ) : polls.length === 0 ? (
              <div className="p-4 text-center py-8">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">No polls yet</p>
                <Link to="/create" className="text-sm text-slate-900 dark:text-white font-medium hover:underline">
                  Create your first one
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-dark-700">
                {polls.map((poll) => (
                  <button
                    key={poll.id}
                    onClick={() => openAnalytics(poll)}
                    className={`w-full text-left p-4 transition-colors ${
                      selected?.id === poll.id
                        ? 'bg-slate-100 dark:bg-dark-700'
                        : 'hover:bg-slate-50 dark:hover:bg-dark-700/50'
                    }`}
                  >
                    <h3 className="font-medium text-slate-900 dark:text-white truncate text-sm">{poll.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {poll.status} • {poll.responseCount || 0} responses
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Analytics */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="space-y-6">
              {/* Poll Header */}
              <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-slate-200 dark:border-dark-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selected.title}</h2>
                    {selected.description && (
                      <p className="text-slate-600 dark:text-slate-400 mt-2">{selected.description}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-4 ${
                    selected.status === 'active'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-slate-100 dark:bg-dark-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {selected.status === 'active' ? 'Active' : 'Closed'}
                  </span>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-dark-700 p-4 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Responses</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{selected.responseCount || 0}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-dark-700 p-4 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Status</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-2 capitalize">{selected.status}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-dark-700 p-4 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Response Mode</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-2 capitalize">{selected.responseMode}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-dark-700 p-4 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Expires</p>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white mt-2">
                      {new Date(selected.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Share Box */}
              <div className="bg-white dark:bg-dark-800 p-6 rounded-xl border border-slate-200 dark:border-dark-700">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Share Poll</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="input-field flex-1 text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink);
                      alert('Link copied to clipboard');
                    }}
                    className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium hover:shadow-lg transition-all text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Analytics */}
              {analytics ? (
                <AnalyticsSummary analytics={analytics} />
              ) : (
                <div className="bg-white dark:bg-dark-800 p-12 rounded-xl border border-slate-200 dark:border-dark-700 text-center">
                  <div className="inline-block animate-spin mb-4">
                    <div className="h-8 w-8 border-4 border-slate-200 dark:border-dark-700 border-t-slate-900 dark:border-t-white rounded-full"></div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">Loading analytics...</p>
                </div>
              )}

              {/* Action Buttons */}
              {selected.status === 'active' && !selected.published && (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="w-full px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {publishing ? 'Publishing...' : 'Publish Poll'}
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-800 p-12 rounded-xl border border-slate-200 dark:border-dark-700 text-center">
              <div className="text-4xl mb-4 opacity-20">📋</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No poll selected</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Select a poll from the list to view analytics</p>
              <Link to="/create" className="inline-block px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-semibold hover:shadow-lg transition-all">
                Create your first poll
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
