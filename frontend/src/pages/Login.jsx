import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { authenticate, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validate = () => {
    if (!form.email) return 'Email is required';
    if (!form.password) return 'Password is required';
    if (mode === 'register' && !form.name) return 'Name is required';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
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
      await authenticate(mode, form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900 flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-7xl">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left Section - Hero */}
          <div className="hidden md:block">
            <div className="space-y-10">
              <div className="space-y-6">
                <p className="text-base uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                  Voices Platform
                </p>
                <h1 className="text-6xl md:text-7xl font-bold text-slate-900 dark:text-white leading-tight">
                  {mode === 'login' ? 'Welcome back' : 'Get started'}
                </h1>
                <p className="text-2xl text-slate-600 dark:text-slate-400 leading-relaxed">
                  {mode === 'login'
                    ? 'Access your polls, dashboards, and real-time analytics.'
                    : 'Create beautiful polls and gather insights in minutes.'}
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-5 items-start">
                  <div className="w-3 h-3 rounded-full bg-slate-900 dark:bg-white mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-lg">Real-time Analytics</p>
                    <p className="text-base text-slate-600 dark:text-slate-400 mt-1">Live updates as responses arrive</p>
                  </div>
                </div>
                <div className="flex gap-5 items-start">
                  <div className="w-3 h-3 rounded-full bg-slate-900 dark:bg-white mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-lg">Secure & Private</p>
                    <p className="text-base text-slate-600 dark:text-slate-400 mt-1">Your data is protected with industry standards</p>
                  </div>
                </div>
                <div className="flex gap-5 items-start">
                  <div className="w-3 h-3 rounded-full bg-slate-900 dark:bg-white mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-lg">Easy to Share</p>
                    <p className="text-base text-slate-600 dark:text-slate-400 mt-1">One link to reach all your respondents</p>
                  </div>
                </div>
              </div>

              <Link
                to="/"
                className="inline-block text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                ← Back to home
              </Link>
            </div>
          </div>

          {/* Right Section - Auth Form */}
          <div className="bg-slate-50 dark:bg-dark-800 p-12 rounded-2xl">
            <div className="space-y-8">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white">
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </h2>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'register' && (
                  <div>
                    <label htmlFor="name" className="block text-base font-medium text-slate-900 dark:text-white mb-3">
                      Full Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="input-field py-3 text-base"
                      disabled={loading}
                      required
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-base font-medium text-slate-900 dark:text-white mb-3">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="input-field py-3 text-base"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-base font-medium text-slate-900 dark:text-white mb-3">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input-field py-3 text-base"
                    disabled={loading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {loading ? 'Processing...' : mode === 'login' ? 'Sign in' : 'Create account'}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300 dark:border-dark-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-50 dark:bg-dark-800 text-slate-500 dark:text-slate-400">
                    or
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                  setForm({ name: '', email: '', password: '' });
                }}
                className="w-full px-4 py-4 border border-slate-300 dark:border-dark-600 text-slate-900 dark:text-white font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors text-lg"
              >
                {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
