import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../api/client';

const newQuestion = () => ({ text: '', required: true, options: [{ text: '' }, { text: '' }] });

export default function CreatePoll() {
  const navigate = useNavigate();
  const defaultExpiry = useMemo(
    () => new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    []
  );

  const [poll, setPoll] = useState({
    title: '',
    description: '',
    responseMode: 'anonymous',
    expiresAt: defaultExpiry,
    questions: [newQuestion()],
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateQuestion = (index, patch) => {
    setPoll(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    }));
  };

  const updateOption = (qIndex, oIndex, text) => {
    setPoll(prev => ({
      ...prev,
      questions: prev.questions.map((q, qi) =>
        qi === qIndex
          ? {
              ...q,
              options: q.options.map((opt, oi) => (oi === oIndex ? { text } : opt)),
            }
          : q
      ),
    }));
  };

  const validate = () => {
    if (poll.title.trim().length < 3) return 'Poll title must be at least 3 characters';
    if (new Date(poll.expiresAt).getTime() <= Date.now())
      return 'Expiry time must be in the future';
    for (const q of poll.questions) {
      if (q.text.trim().length < 3) return 'Every question needs meaningful text';
      const validOptions = q.options.filter(opt => opt.text.trim());
      if (validOptions.length < 2) return 'Every question needs at least 2 options';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload = await apiPost('/polls', poll);
      navigate(`/poll/${payload.poll.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
          Create a Poll
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
          Build engaging polls with multiple questions and gather feedback from your audience.
        </p>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-slate-200 dark:border-dark-700">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          {/* Basic Info Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Poll Details
            </h2>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Poll Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={poll.title}
                    onChange={e => setPoll(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="What should we ask?"
                    className="input-field py-3 text-base"
                    disabled={loading}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="expiry" className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Expires At
                  </label>
                  <input
                    id="expiry"
                    type="datetime-local"
                    value={poll.expiresAt}
                    onChange={e => setPoll(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className="input-field py-3 text-base"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={poll.description}
                  onChange={e => setPoll(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide context for respondents..."
                  className="input-field min-h-28 resize-none py-3 text-base"
                  disabled={loading}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="mode" className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Response Mode
                  </label>
                  <select
                    id="mode"
                    value={poll.responseMode}
                    onChange={e => setPoll(prev => ({ ...prev, responseMode: e.target.value }))}
                    className="input-field py-3 text-base"
                    disabled={loading}
                  >
                    <option value="anonymous">Anonymous</option>
                    <option value="authenticated">Authenticated Only</option>
                  </select>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-dark-700 rounded-lg border border-slate-200 dark:border-dark-600 flex items-center justify-between">
                  <span className="text-base font-medium text-slate-700 dark:text-slate-300">Questions</span>
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">{poll.questions.length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-dark-700"></div>

          {/* Questions Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Questions
            </h2>
            <div className="space-y-8">
              {poll.questions.map((question, qIdx) => (
                <div key={qIdx} className="p-8 bg-slate-50 dark:bg-dark-700 rounded-xl border border-slate-200 dark:border-dark-600">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                      Question {qIdx + 1}
                    </h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={e =>
                          updateQuestion(qIdx, { required: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-slate-300 dark:border-dark-600"
                        disabled={loading}
                      />
                      <span className="text-base font-medium text-slate-600 dark:text-slate-400">Required</span>
                    </label>
                  </div>

                  <div className="mb-6">
                    <label htmlFor={`q-${qIdx}`} className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Question Text
                    </label>
                    <input
                      id={`q-${qIdx}`}
                      type="text"
                      value={question.text}
                      onChange={e =>
                        updateQuestion(qIdx, { text: e.target.value })
                      }
                      placeholder="Enter your question..."
                      className="input-field py-3 text-base font-medium"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Options */}
                  <div className="space-y-4 mb-6">
                    <p className="text-base font-medium text-slate-700 dark:text-slate-300">Options</p>
                    {question.options.map((option, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                          <input
                            type="radio"
                            disabled
                            className="w-5 h-5 text-slate-400"
                          />
                        </div>
                        <input
                          type="text"
                          value={option.text}
                          onChange={e =>
                            updateOption(qIdx, oIdx, e.target.value)
                          }
                          placeholder={`Option ${oIdx + 1}`}
                          className="input-field flex-1 py-3 text-base"
                          disabled={loading}
                        />
                        {question.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              updateQuestion(qIdx, {
                                options: question.options.filter(
                                  (_, i) => i !== oIdx
                                ),
                              })
                            }
                            className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-base font-medium transition-colors"
                            disabled={loading}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Question Actions */}
                  <div className="flex gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuestion(qIdx, {
                          options: [...question.options, { text: '' }],
                        })
                      }
                      className="text-base px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-dark-600 rounded transition-colors font-medium"
                      disabled={loading}
                    >
                      + Add option
                    </button>
                    {poll.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setPoll(prev => ({
                            ...prev,
                            questions: prev.questions.filter((_, i) => i !== qIdx),
                          }))
                        }
                        className="text-base px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors font-medium ml-auto"
                        disabled={loading}
                      >
                        Remove question
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Question Button */}
            <button
              type="button"
              onClick={() =>
                setPoll(prev => ({
                  ...prev,
                  questions: [...prev.questions, newQuestion()],
                }))
              }
              className="w-full px-6 py-4 border-2 border-dashed border-slate-300 dark:border-dark-600 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-dark-500 rounded-lg transition-colors font-semibold text-base"
              disabled={loading}
            >
              + Add Question
            </button>
          </div>

          <div className="border-t border-slate-200 dark:border-dark-700"></div>

          {/* Submit */}
          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? 'Creating...' : 'Create Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
