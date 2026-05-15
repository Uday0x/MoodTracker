import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { apiGet, apiPost } from '../api/client';
import AnalyticsSummary from '../components/AnalyticsSummary';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export default function PublicPoll() {
  const { pollId } = useParams();
  const { user } = useAuth();
  const [poll, setPoll] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadPoll();
  }, [pollId]);

  // Auto-fetch analytics after submission (only once)
  useEffect(() => {
    if (!submitted || !poll) return;
    
    const timer = setTimeout(async () => {
      try {
        const { poll: updatedPoll } = await apiGet(`/polls/${poll.id}`);
        setPoll(updatedPoll);
        if (updatedPoll.analytics) {
          setAnalytics(updatedPoll.analytics);
        }
      } catch (err) {
        console.error('Failed to reload poll:', err);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [submitted]); // Only re-run when submitted changes
  useEffect(() => {
    if (!poll) return;

    const socket = io(SOCKET_URL, { 
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });
    
    socket.emit('poll:subscribe', poll.id);
    socket.on('analytics:update', (updatedAnalytics) => {
      setAnalytics(updatedAnalytics);
      // Update poll with new analytics
      setPoll(prev => ({
        ...prev,
        analytics: updatedAnalytics
      }));
    });

    return () => {
      socket.emit('poll:unsubscribe', poll.id);
      socket.disconnect();
    };
  }, [poll?.id]);

  const loadPoll = async () => {
    try {
      setLoading(true);
      const { poll: loadedPoll } = await apiGet(`/polls/${pollId}`);
      setPoll(loadedPoll);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const missing = poll.questions.find(
      q => q.required && !answers[q.id]
    );
    if (missing) {
      setError(`Please answer: ${missing.text}`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiPost(`/polls/${poll.id}/responses`, {
        answers: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId,
          optionId,
        })),
      });
      setSubmitted(true);
      if (response.analytics) {
        setAnalytics(response.analytics);
      }
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <div className="h-12 w-12 border-4 border-slate-200 border-t-primary rounded-full"></div>
          </div>
          <p className="text-slate-600 font-medium">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="card-body text-center">
            <p className="text-slate-600 mb-4">{error}</p>
            <Link to="/" className="btn btn-primary">
              ← Back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  const isActive = poll.status === 'active' && !poll.published;
  const requiresAuth = poll.responseMode === 'authenticated' && !user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-900 dark:to-dark-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-12 bg-white dark:bg-dark-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-dark-700">
          <div className="flex items-center gap-3 mb-6">
            <span className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap ${
              poll.status === 'active'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : poll.status === 'completed'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
              {poll.status.toUpperCase()}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
            {poll.title}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            {poll.description ||
              'Share your feedback by selecting one option per question.'}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 border-t border-slate-200 dark:border-dark-700 text-sm text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-2">
              {poll.responseMode === 'anonymous'
                ? '🔒 Anonymous responses'
                : '👤 Authenticated responses required'}
            </span>
            <span className="hidden sm:block text-slate-300 dark:text-dark-600">•</span>
            <span className="flex items-center gap-2">
              ⏰ Expires {new Date(poll.expiresAt).toLocaleDateString()} at{' '}
              {new Date(poll.expiresAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Main Content */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-6 py-4 rounded-xl mb-8 font-medium">{error}</div>
        )}

        {poll.published ? (
          <>
            <div className="mb-8 bg-white dark:bg-dark-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-dark-700">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                Final Published Results
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Thank you for your feedback. Here are the final results.
              </p>
            </div>
            <AnalyticsSummary analytics={analytics || poll.analytics} />
          </>
        ) : submitted ? (
          <>
            <div className="mb-8 bg-white dark:bg-dark-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-dark-700">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                Live Poll Results
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Thank you! Here are the current poll results.
              </p>
            </div>
            {(analytics || poll.analytics) && <AnalyticsSummary analytics={analytics || poll.analytics} />}
            {!analytics && !poll.analytics && (
              <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-slate-200 dark:border-dark-700 p-8">
                <div className="text-center py-8">
                  <p className="text-slate-600 dark:text-slate-400">Loading results...</p>
                </div>
              </div>
            )}
          </>
        ) : !isActive ? (
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-slate-200 dark:border-dark-700 p-8">
            <div className="text-center py-12">
              <p className="text-6xl mb-4">🚫</p>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                This poll is inactive
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                Responses are closed because the poll expired or was completed.
              </p>
              <Link to="/" className="inline-block px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
                ← Back home
              </Link>
            </div>
          </div>
        ) : requiresAuth ? (
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-slate-200 dark:border-dark-700 p-8">
            <div className="text-center py-12">
              <p className="text-6xl mb-4">🔐</p>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                Authentication required
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                The creator requires authenticated feedback for this poll.
              </p>
              <Link to="/login" className="inline-block px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
                Log in to respond →
              </Link>
            </div>
          </div>
        ) : submitted ? (
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-slate-200 dark:border-dark-700 p-8">
            <div className="text-center py-12">
              <p className="text-6xl mb-4">✅</p>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                Response received
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                Thank you! Your feedback has been recorded.
              </p>
              <Link to="/" className="inline-block px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
                ← Back home
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-slate-200 dark:border-dark-700">
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {poll.questions.map((question, qIdx) => (
                <div key={question.id} className="space-y-6">
                  <div>
                    <label className="block text-lg font-bold text-slate-900 dark:text-white mb-1">
                      {question.text}
                      {question.required && (
                        <span className="text-red-500 ml-2">*</span>
                      )}
                    </label>
                    {qIdx < poll.questions.length - 1 && (
                      <div className="h-px bg-slate-200 dark:bg-dark-700 mt-4"></div>
                    )}
                  </div>
                  <div className="space-y-3 mt-4">
                    {question.options.map(option => (
                      <label
                        key={option.id}
                        className="flex items-center p-4 rounded-xl border-2 border-slate-200 dark:border-dark-600 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option.id}
                          checked={answers[question.id] === option.id}
                          onChange={() =>
                            setAnswers(prev => ({
                              ...prev,
                              [question.id]: option.id,
                            }))
                          }
                          className="w-5 h-5 rounded-full accent-blue-600"
                          required={question.required}
                          disabled={submitting}
                        />
                        <span className="ml-4 font-semibold text-slate-900 dark:text-white text-base">
                          {option.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="border-t-2 border-slate-200 dark:border-dark-700 pt-8"></div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                {submitting ? '⏳ Submitting...' : '✨ Submit feedback'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
