import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import AnalyticsSummary from '../components/AnalyticsSummary';
import { useAuth } from '../context/AuthContext';

export default function PublicPoll() {
  const { pollId } = useParams();
  const { user } = useAuth();
  const [poll, setPoll] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/polls/${pollId}`)
      .then(({ poll: loadedPoll }) => setPoll(loadedPoll))
      .catch((err) => setError(err.message));
  }, [pollId]);

  async function submit(event) {
    event.preventDefault();
    const missing = poll.questions.find((question) => question.required && !answers[question.id]);
    if (missing) return setError(`Please answer mandatory question: ${missing.text}`);

    try {
      await api(`/polls/${poll.id}/responses`, {
        method: 'POST',
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId }))
        })
      });
      setSubmitted(true);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !poll) return <section className="card narrow"><div className="alert">{error}</div><Link to="/">Back home</Link></section>;
  if (!poll) return <section className="card narrow"><p>Loading poll…</p></section>;

  const accepting = poll.status === 'active' && !poll.published;
  const needsLogin = poll.responseMode === 'authenticated' && !user;

  return <section className="card public-card">
    <div className="hero-mini">
      <span className={`badge ${poll.status}`}>{poll.status}</span>
      <h1>{poll.title}</h1>
      <p>{poll.description || 'Share your feedback by choosing one option for each question.'}</p>
      <small>{poll.responseMode === 'anonymous' ? 'Anonymous responses allowed' : 'Authenticated responses required'} · Expires {new Date(poll.expiresAt).toLocaleString()}</small>
    </div>

    {error && <div className="alert">{error}</div>}

    {poll.published ? <>
      <h2>Final published results</h2>
      <AnalyticsSummary analytics={poll.analytics} />
    </> : !accepting ? <div className="empty-state"><h2>This poll is inactive</h2><p>Responses are closed because the poll expired or was completed.</p></div> : needsLogin ? <div className="empty-state"><h2>Login required</h2><p>The creator requires authenticated feedback for this poll.</p><Link className="primary" to="/login">Log in to respond</Link></div> : submitted ? <div className="empty-state success"><h2>Response received</h2><p>Thanks! Your feedback has been recorded.</p></div> : <form className="stack" onSubmit={submit}>
      {poll.questions.map((question) => <fieldset className="question-field" key={question.id}>
        <legend>{question.text} {question.required && <span className="required">*</span>}</legend>
        {question.options.map((option) => <label className="choice" key={option.id}>
          <input type="radio" name={question.id} value={option.id} required={question.required} checked={answers[question.id] === option.id} onChange={() => setAnswers({ ...answers, [question.id]: option.id })} />
          <span>{option.text}</span>
        </label>)}
      </fieldset>)}
      <button className="primary">Submit feedback</button>
    </form>}
  </section>;
}
