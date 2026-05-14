import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { authenticate } = useAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      await authenticate(mode, form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  return <section className="auth-grid">
    <div className="hero-card">
      <span className="eyebrow">Secure poll workspace</span>
      <h1>Create, share and analyze polls in real time.</h1>
      <p>Authenticated creators get protected dashboards, publish controls and live Socket.io analytics.</p>
      <Link className="ghost-link" to="/poll/demo">Public poll links stay simple</Link>
    </div>
    <form className="card auth-card" onSubmit={submit}>
      <h2>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
      {error && <div className="alert">{error}</div>}
      {mode === 'register' && <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>}
      <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
      <label>Password<input type="password" minLength="6" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label>
      <button className="primary">{mode === 'login' ? 'Log in' : 'Register'}</button>
      <button className="text-button" type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Need an account?' : 'Already have an account?'}
      </button>
    </form>
  </section>;
}
