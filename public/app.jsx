const { useEffect, useMemo, useState } = React;

const API = '';
const initialQuestion = () => ({ text: '', required: true, options: [{ text: '' }, { text: '' }] });

function api(path, options = {}) {
  const token = localStorage.getItem('pollpulse_token');
  return fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Request failed.');
    return payload;
  });
}

function formatDate(date) {
  return new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function App() {
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState(location.hash || '#/dashboard');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const onHash = () => setRoute(location.hash || '#/dashboard');
    window.addEventListener('hashchange', onHash);
    api('/api/me').then(({ user }) => setUser(user)).catch(() => localStorage.removeItem('pollpulse_token'));
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  function notify(message) {
    setToast(message);
    setTimeout(() => setToast(''), 4000);
  }

  function logout() {
    localStorage.removeItem('pollpulse_token');
    setUser(null);
    location.hash = '#/dashboard';
  }

  const pollId = route.match(/^#\/poll\/(.+)$/)?.[1];

  return <>
    <header className="topbar">
      <a className="brand" href="#/dashboard">PollPulse</a>
      <nav>
        <a href="#/dashboard">Dashboard</a>
        <a href="#/create">Create poll</a>
        {user ? <button onClick={logout}>Log out {user.name}</button> : <a href="#/login">Log in</a>}
      </nav>
    </header>
    {toast && <div className="toast">{toast}</div>}
    <main>
      {pollId ? <PublicPoll pollId={pollId} user={user} notify={notify} /> : route === '#/create' ? <Protected user={user}><PollBuilder notify={notify} /></Protected> : route === '#/login' ? <Auth setUser={setUser} notify={notify} /> : <Protected user={user}><Dashboard notify={notify} /></Protected>}
    </main>
  </>;
}

function Protected({ user, children }) {
  if (!user) return <section className="card narrow"><h1>Sign in required</h1><p>Create an account or log in to create polls and view analytics.</p><a className="primary" href="#/login">Continue to login</a></section>;
  return children;
}

function Auth({ setUser, notify }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  async function submit(event) {
    event.preventDefault();
    try {
      const payload = await api(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) });
      localStorage.setItem('pollpulse_token', payload.token);
      setUser(payload.user);
      notify(`Welcome, ${payload.user.name}!`);
      location.hash = '#/dashboard';
    } catch (error) { notify(error.message); }
  }
  return <section className="card narrow">
    <h1>{mode === 'login' ? 'Log in' : 'Create account'}</h1>
    <form onSubmit={submit} className="stack">
      {mode === 'register' && <input placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />}
      <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <input type="password" minLength="6" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      <button className="primary">{mode === 'login' ? 'Log in' : 'Register'}</button>
    </form>
    <button className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Need an account?' : 'Already have an account?'}</button>
  </section>;
}

function PollBuilder({ notify }) {
  const defaultExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 16);
  const [poll, setPoll] = useState({ title: '', description: '', responseMode: 'anonymous', expiresAt: defaultExpiry, questions: [initialQuestion()] });

  function updateQuestion(index, patch) {
    setPoll({ ...poll, questions: poll.questions.map((question, i) => i === index ? { ...question, ...patch } : question) });
  }
  function updateOption(questionIndex, optionIndex, text) {
    setPoll({ ...poll, questions: poll.questions.map((question, i) => i === questionIndex ? { ...question, options: question.options.map((option, j) => j === optionIndex ? { text } : option) } : question) });
  }
  function validate() {
    if (poll.title.trim().length < 3) return 'Title must be at least 3 characters.';
    if (new Date(poll.expiresAt) <= new Date()) return 'Expiry must be in the future.';
    for (const question of poll.questions) {
      if (question.text.trim().length < 3) return 'Every question needs meaningful text.';
      if (question.options.filter((option) => option.text.trim()).length < 2) return 'Every question needs at least two options.';
    }
    return '';
  }
  async function submit(event) {
    event.preventDefault();
    const problem = validate();
    if (problem) return notify(problem);
    try {
      const payload = await api('/api/polls', { method: 'POST', body: JSON.stringify(poll) });
      notify('Poll created. Share the public link!');
      location.hash = `#/poll/${payload.poll.id}`;
    } catch (error) { notify(error.message); }
  }

  return <section className="card wide">
    <h1>Create a poll</h1>
    <form onSubmit={submit} className="stack">
      <div className="grid two">
        <label>Poll title<input value={poll.title} onChange={(e) => setPoll({ ...poll, title: e.target.value })} placeholder="Hackathon project feedback" required /></label>
        <label>Expiry time<input type="datetime-local" value={poll.expiresAt} onChange={(e) => setPoll({ ...poll, expiresAt: e.target.value })} required /></label>
      </div>
      <label>Description<textarea value={poll.description} onChange={(e) => setPoll({ ...poll, description: e.target.value })} placeholder="Tell participants what you want to learn." /></label>
      <label>Response mode<select value={poll.responseMode} onChange={(e) => setPoll({ ...poll, responseMode: e.target.value })}><option value="anonymous">Anonymous responses</option><option value="authenticated">Authenticated responses only</option></select></label>
      {poll.questions.map((question, questionIndex) => <div className="question-editor" key={questionIndex}>
        <div className="question-head"><h3>Question {questionIndex + 1}</h3><label className="inline"><input type="checkbox" checked={question.required} onChange={(e) => updateQuestion(questionIndex, { required: e.target.checked })} /> Mandatory</label></div>
        <input value={question.text} onChange={(e) => updateQuestion(questionIndex, { text: e.target.value })} placeholder="Question text" required />
        {question.options.map((option, optionIndex) => <div className="option-row" key={optionIndex}>
          <span>○</span><input value={option.text} onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)} placeholder={`Option ${optionIndex + 1}`} required />
          {question.options.length > 2 && <button type="button" onClick={() => updateQuestion(questionIndex, { options: question.options.filter((_, i) => i !== optionIndex) })}>Remove</button>}
        </div>)}
        <button type="button" onClick={() => updateQuestion(questionIndex, { options: [...question.options, { text: '' }] })}>Add option</button>
        {poll.questions.length > 1 && <button type="button" className="danger" onClick={() => setPoll({ ...poll, questions: poll.questions.filter((_, i) => i !== questionIndex) })}>Remove question</button>}
      </div>)}
      <button type="button" onClick={() => setPoll({ ...poll, questions: [...poll.questions, initialQuestion()] })}>Add question</button>
      <button className="primary">Create shareable poll</button>
    </form>
  </section>;
}

function Dashboard({ notify }) {
  const [polls, setPolls] = useState([]);
  const [selected, setSelected] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => { loadPolls(); }, []);
  async function loadPolls() {
    try { setPolls((await api('/api/polls')).polls); } catch (error) { notify(error.message); }
  }
  async function openAnalytics(poll) {
    setSelected(poll);
    try { setAnalytics((await api(`/api/polls/${poll.id}/analytics`)).analytics); } catch (error) { notify(error.message); }
  }
  async function publish() {
    try {
      const payload = await api(`/api/polls/${selected.id}/publish`, { method: 'POST' });
      setAnalytics(payload.poll.analytics);
      notify('Final results are now public on the same poll link.');
      loadPolls();
    } catch (error) { notify(error.message); }
  }
  useLiveAnalytics(selected?.id, setAnalytics);

  return <section className="dashboard">
    <div className="card">
      <div className="section-title"><h1>Your polls</h1><a className="primary" href="#/create">New poll</a></div>
      {!polls.length && <p>No polls yet. Create one to collect feedback.</p>}
      <div className="poll-list">{polls.map((poll) => <button className="poll-card" key={poll.id} onClick={() => openAnalytics(poll)}>
        <strong>{poll.title}</strong><span>{poll.totalResponses} responses · {poll.status}</span><small>Expires {formatDate(poll.expiresAt)}</small>
      </button>)}</div>
    </div>
    <div className="card analytics-panel">
      {selected && analytics ? <>
        <div className="section-title"><div><h2>{analytics.title}</h2><p>Live analytics update automatically while respondents submit feedback.</p></div><button onClick={publish} disabled={analytics.published}>Publish final results</button></div>
        <ShareBox pollId={selected.id} />
        <Analytics analytics={analytics} />
      </> : <p>Select a poll to view question-wise summaries, option counts and participation insights.</p>}
    </div>
  </section>;
}

function ShareBox({ pollId }) {
  const link = `${location.origin}${location.pathname}#/poll/${pollId}`;
  return <div className="share-box"><span>{link}</span><button onClick={() => navigator.clipboard?.writeText(link)}>Copy public link</button></div>;
}

function useLiveAnalytics(pollId, setAnalytics) {
  useEffect(() => {
    if (!pollId) return;
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${location.host}`);
    socket.addEventListener('open', () => socket.send(JSON.stringify({ type: 'subscribe', pollId })));
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'analytics:update') setAnalytics(message.analytics);
    });
    return () => socket.close();
  }, [pollId]);
}

function PublicPoll({ pollId, user, notify }) {
  const [poll, setPoll] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const analytics = poll?.analytics;

  useEffect(() => { api(`/api/polls/${pollId}`).then(({ poll }) => setPoll(poll)).catch((error) => notify(error.message)); }, [pollId]);
  useLiveAnalytics(pollId, (live) => setPoll((current) => current ? { ...current, analytics: live } : current));

  if (!poll) return <section className="card narrow"><p>Loading poll…</p></section>;
  const accepting = poll.status === 'active' && !poll.published;
  const needsLogin = poll.responseMode === 'authenticated' && !user;

  async function submit(event) {
    event.preventDefault();
    const missing = poll.questions.find((question) => question.required && !answers[question.id]);
    if (missing) return notify(`Please answer mandatory question: ${missing.text}`);
    try {
      await api(`/api/polls/${poll.id}/responses`, { method: 'POST', body: JSON.stringify({ answers: Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId })) }) });
      setSubmitted(true);
      notify('Thanks! Your feedback was submitted.');
    } catch (error) { notify(error.message); }
  }

  return <section className="card wide">
    <div className="hero-mini"><span className={`badge ${poll.status}`}>{poll.status}</span><h1>{poll.title}</h1><p>{poll.description}</p><small>{poll.responseMode === 'anonymous' ? 'Anonymous responses allowed' : 'Authenticated responses required'} · Expires {formatDate(poll.expiresAt)}</small></div>
    {poll.published ? <><h2>Final published results</h2><Analytics analytics={analytics} /></> : !accepting ? <div className="empty-state"><h2>This poll is inactive</h2><p>Responses are closed because the poll expired or was completed.</p></div> : needsLogin ? <div className="empty-state"><h2>Log in to respond</h2><p>The creator requires authenticated feedback for this poll.</p><a className="primary" href="#/login">Log in</a></div> : submitted ? <div className="empty-state"><h2>Response received</h2><p>Your feedback has been recorded. Live counts are visible to the creator.</p></div> : <form onSubmit={submit} className="stack">
      {poll.questions.map((question) => <fieldset key={question.id}>
        <legend>{question.text} {question.required && <span className="required">*</span>}</legend>
        {question.options.map((option) => <label className="choice" key={option.id}><input type="radio" name={question.id} value={option.id} required={question.required} checked={answers[question.id] === option.id} onChange={() => setAnswers({ ...answers, [question.id]: option.id })} />{option.text}</label>)}
      </fieldset>)}
      <button className="primary">Submit feedback</button>
    </form>}
  </section>;
}

function Analytics({ analytics }) {
  if (!analytics) return <p>Analytics will appear after the first response.</p>;
  return <div className="analytics">
    <div className="stats"><div><strong>{analytics.totalResponses}</strong><span>Total responses</span></div><div><strong>{analytics.anonymousResponses}</strong><span>Anonymous</span></div><div><strong>{analytics.authenticatedResponses}</strong><span>Authenticated</span></div></div>
    {analytics.questions.map((question) => <article className="summary" key={question.id}>
      <h3>{question.text}</h3><p>{question.answered} answered · {question.skipped} skipped</p>
      {question.options.map((option) => <div className="bar-row" key={option.id}><span>{option.text}</span><div className="bar"><i style={{ width: `${option.percentage}%` }} /></div><b>{option.count}</b><small>{option.percentage}%</small></div>)}
    </article>)}
  </div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
