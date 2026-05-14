import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const newQuestion = () => ({ text: '', required: true, options: [{ text: '' }, { text: '' }] });

export default function CreatePoll() {
  const navigate = useNavigate();
  const defaultExpiry = useMemo(() => new Date(Date.now() + 86400000).toISOString().slice(0, 16), []);
  const [poll, setPoll] = useState({ title: '', description: '', responseMode: 'anonymous', expiresAt: defaultExpiry, questions: [newQuestion()] });
  const [error, setError] = useState('');

  function updateQuestion(index, patch) {
    setPoll({ ...poll, questions: poll.questions.map((question, current) => current === index ? { ...question, ...patch } : question) });
  }

  function updateOption(questionIndex, optionIndex, text) {
    setPoll({
      ...poll,
      questions: poll.questions.map((question, currentQuestion) => currentQuestion === questionIndex
        ? { ...question, options: question.options.map((option, currentOption) => currentOption === optionIndex ? { text } : option) }
        : question)
    });
  }

  function validate() {
    if (poll.title.trim().length < 3) return 'Poll title must be at least 3 characters.';
    if (new Date(poll.expiresAt).getTime() <= Date.now()) return 'Expiry time must be in the future.';
    for (const question of poll.questions) {
      if (question.text.trim().length < 3) return 'Every question needs meaningful text.';
      if (question.options.filter((option) => option.text.trim()).length < 2) return 'Every question needs at least two options.';
    }
    return '';
  }

  async function submit(event) {
    event.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);
    setError('');
    try {
      const payload = await api('/polls', { method: 'POST', body: JSON.stringify(poll) });
      return navigate(`/poll/${payload.poll.id}`);
    } catch (err) {
      return setError(err.message);
    }
  }

  return <section className="card wide">
    <div className="section-title">
      <div>
        <span className="eyebrow">Dynamic React form</span>
        <h1>Create a poll</h1>
        <p>Single-choice questions, required toggles, response mode and expiry are validated before submission.</p>
      </div>
    </div>
    {error && <div className="alert">{error}</div>}
    <form className="stack" onSubmit={submit}>
      <div className="grid two">
        <label>Poll title<input value={poll.title} onChange={(event) => setPoll({ ...poll, title: event.target.value })} placeholder="Hackathon feedback" required /></label>
        <label>Expiry time<input type="datetime-local" value={poll.expiresAt} onChange={(event) => setPoll({ ...poll, expiresAt: event.target.value })} required /></label>
      </div>
      <label>Description<textarea value={poll.description} onChange={(event) => setPoll({ ...poll, description: event.target.value })} placeholder="Tell respondents what feedback you need." /></label>
      <label>Response mode<select value={poll.responseMode} onChange={(event) => setPoll({ ...poll, responseMode: event.target.value })}><option value="anonymous">Anonymous responses</option><option value="authenticated">Authenticated only</option></select></label>

      {poll.questions.map((question, questionIndex) => <article className="question-editor" key={questionIndex}>
        <div className="question-head">
          <h3>Question {questionIndex + 1}</h3>
          <label className="inline"><input type="checkbox" checked={question.required} onChange={(event) => updateQuestion(questionIndex, { required: event.target.checked })} /> Mandatory</label>
        </div>
        <input value={question.text} onChange={(event) => updateQuestion(questionIndex, { text: event.target.value })} placeholder="Question text" required />
        {question.options.map((option, optionIndex) => <div className="option-row" key={optionIndex}>
          <span>○</span>
          <input value={option.text} onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)} placeholder={`Option ${optionIndex + 1}`} required />
          {question.options.length > 2 && <button type="button" onClick={() => updateQuestion(questionIndex, { options: question.options.filter((_, current) => current !== optionIndex) })}>Remove</button>}
        </div>)}
        <div className="button-row">
          <button type="button" onClick={() => updateQuestion(questionIndex, { options: [...question.options, { text: '' }] })}>Add option</button>
          {poll.questions.length > 1 && <button className="danger" type="button" onClick={() => setPoll({ ...poll, questions: poll.questions.filter((_, current) => current !== questionIndex) })}>Remove question</button>}
        </div>
      </article>)}

      <button type="button" onClick={() => setPoll({ ...poll, questions: [...poll.questions, newQuestion()] })}>Add another question</button>
      <button className="primary">Create shareable poll</button>
    </form>
  </section>;
}
