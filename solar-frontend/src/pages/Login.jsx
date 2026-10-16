import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { errMsg } from '../api/client';
import { Field, Notice } from '../components/ui';

export default function Login() {
  const { login, notice } = useAuth();
  const [kind, setKind] = useState('junior');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter email and password');
      return;
    }
    setBusy(true);
    try {
      await login(kind, email.trim(), password);
    } catch (err) {
      setError(err.response ? errMsg(err, 'Login failed') : (err.request ? errMsg(err) : err.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <span className="brand-logo">☀</span>
        <h1>Solar Service Management</h1>
        <p>Manage employees, customers, service jobs, attendance, salary and support chat from one admin panel.</p>
      </div>
      <div className="login-panel">
        <form className="login-box" onSubmit={submit} noValidate>
          <h1>Sign in</h1>
          <p className="muted">Choose your account type</p>
          <div className="tabs" role="tablist">
            <button type="button" role="tab" aria-selected={kind === 'junior'} className={`tab ${kind === 'junior' ? 'active' : ''}`} onClick={() => setKind('junior')}>Junior Admin</button>
            <button type="button" role="tab" aria-selected={kind === 'super'} className={`tab ${kind === 'super' ? 'active' : ''}`} onClick={() => setKind('super')}>SuperAdmin</button>
          </div>
          <Notice type="info">{notice}</Notice>
          <Notice type="error">{error}</Notice>
          <Field label="Email">
            <input className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <button className="btn" style={{ width: '100%' }} disabled={busy}>{busy ? 'Signing in…' : 'Login'}</button>
        </form>
      </div>
    </div>
  );
}
