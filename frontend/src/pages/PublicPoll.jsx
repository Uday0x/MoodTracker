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
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className={`badge ${
            poll.status === 'active'
              ? 'badge-success'
              : poll.status === 'completed'
              ? 'badge-primary'
              : 'badge-danger'
          }`}>
            {poll.status}
          </span>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          {poll.title}
        </h1>
        <p className="text-lg text-slate-600 mb-4">
          {poll.description ||
            'Share your feedback by selecting one option per question.'}
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
          <span>
            {poll.responseMode === 'anonymous'
              ? '🔒 Anonymous responses'
              : '👤 Authenticated responses required'}
          </span>
          <span>
            ⏰ Expires{' '}
            {new Date(poll.expiresAt).toLocaleDateString()} at{' '}
            {new Date(poll.expiresAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Main Content */}
      {error && (
        <div className="alert alert-error mb-6 rounded-lg">{error}</div>
      )}

      {poll.published ? (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Final Published Results
            </h2>
            <p className="text-slate-600">
              Thank you for your feedback. Here are the final results.
            </p>
          </div>
          <AnalyticsSummary analytics={analytics || poll.analytics} />
        </>
      ) : submitted ? (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Live Poll Results
            </h2>
            <p className="text-slate-600">
              Thank you! Here are the current poll results.
            </p>
          </div>
          {(analytics || poll.analytics) && <AnalyticsSummary analytics={analytics || poll.analytics} />}
          {!analytics && !poll.analytics && (
            <div className="card">
              <div className="card-body text-center py-8">
                <p className="text-slate-600">Loading results...</p>
              </div>
            </div>
          )}
        </>
      ) : !isActive ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-4xl mb-3">🚫</p>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              This poll is inactive
            </h2>
            <p className="text-slate-600 mb-6">
              Responses are closed because the poll expired or was completed.
            </p>
            <Link to="/" className="btn btn-primary">
              ← Back home
            </Link>
          </div>
        </div>
      ) : requiresAuth ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-4xl mb-3">🔐</p>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Authentication required
            </h2>
            <p className="text-slate-600 mb-6">
              The creator requires authenticated feedback for this poll.
            </p>
            <Link to="/login" className="btn btn-primary">
              Log in to respond →
            </Link>
          </div>
        </div>
      ) : submitted ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-4xl mb-3">✅</p>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Response received
            </h2>
            <p className="text-slate-600 mb-6">
              Thank you! Your feedback has been recorded.
            </p>
            <Link to="/" className="btn btn-primary">
              ← Back home
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <form onSubmit={handleSubmit} className="card-body space-y-8">
            {poll.questions.map((question, qIdx) => (
              <div key={question.id} className="space-y-4">
                <div>
                  <label className="label">
                    {question.text}
                    {question.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                </div>
                <div className="space-y-2">
                  {question.options.map(option => (
                    <label
                      key={option.id}
                      className="flex items-center p-3 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
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
                        className="w-4 h-4 rounded-full"
                        required={question.required}
                        disabled={submitting}
                      />
                      <span className="ml-3 font-medium text-slate-900">
                        {option.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="divider"></div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full py-3 text-lg"
            >
              {submitting ? 'Submitting...' : 'Submit feedback'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
