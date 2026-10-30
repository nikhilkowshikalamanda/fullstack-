import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Field, { describe } from '../components/Field.jsx';

export default function AdminLogin() {
  const { admin, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (admin) return <Navigate to="/admin" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) { setError('Enter your username and password.'); return; }
    setBusy(true);
    try {
      await login(username.trim(), password);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container narrow section">
      <h1>Administrator login</h1>
      <div className="alert alert-warn">
        <p><strong>Academic demonstration only.</strong> This login uses one account from the server's .env file and in-memory sessions.
        It is not suitable for a real public service.</p>
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <form className="card form" onSubmit={onSubmit} noValidate>
        <Field id="username" label="Username" required>
          <input {...describe('username')} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </Field>
        <Field id="password" label="Password" required>
          <input {...describe('password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </Field>
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </div>
  );
}
