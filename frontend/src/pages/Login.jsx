import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../services/api';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [role, setRole] = useState(() => from?.pathname === '/admin' ? 'ADMIN' : 'STUDENT');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={from || (user.role === 'ADMIN' ? '/admin' : '/dashboard')} replace />;
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(form.email, form.password, role);
      nav(from || (u.role === 'ADMIN' ? '/admin' : '/dashboard'), { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth auth-login">
      <section className="auth-side">
        <div className="auth-brand">
          <img className="auth-brand-logo" src="/projectvault-mark.svg" alt="" />
          <span className="brand-wordmark">Project<span>Vault</span><small>ACADEMIC PROJECT REPOSITORY</small></span>
        </div>
        <div className="auth-story">
          <p className="auth-kicker">YOUR PROJECTS, ORGANIZED</p>
          <h1>Store your work.<br />Manage it all.</h1>
          <p className="auth-description">
            Store academic projects, organize files, and keep every version and update in one secure place.
          </p>
          <div className="auth-preview" aria-hidden="true">
            <div className="auth-preview-top">
              <span className="auth-preview-dot" />
              <span className="auth-preview-dot" />
              <span className="auth-preview-dot" />
              <span className="auth-preview-label">YOUR PROJECT VAULT</span>
            </div>
            <div className="auth-preview-content">
              <div className="auth-preview-icon">P</div>
              <div className="auth-preview-copy">
                <strong>Projects, all in one place</strong>
                <span>Files · Versions · Organization</span>
              </div>
              <span className="auth-preview-arrow">↗</span>
            </div>
            <div className="auth-preview-bars"><i /><i /><i /></div>
          </div>
        </div>
        <p className="auth-footer">A focused home for your academic journey.</p>
      </section>
      <section className="auth-form">
        <div className="auth-form-inner">
          <div className="auth-mobile-brand">
            <img className="auth-brand-logo" src="/projectvault-mark.svg" alt="" />
            <span className="brand-wordmark">Project<span>Vault</span><small>ACADEMIC PROJECT REPOSITORY</small></span>
          </div>
          <form onSubmit={submit}>
            <p className="auth-form-kicker">WELCOME BACK</p>
            <h2>Sign in to your vault</h2>
            <p className="auth-form-intro">Pick up where you left off.</p>
            <div className="auth-role-switch" role="tablist" aria-label="Choose account type">
              {['STUDENT', 'ADMIN'].map((r) => (
                <button type="button" key={r} role="tab" aria-selected={role === r}
                  className={`auth-role ${role === r ? 'on' : ''}`} onClick={() => setRole(r)}>
                  <span className="auth-role-indicator" aria-hidden="true">{r === 'STUDENT' ? 'S' : 'A'}</span>
                  <span>{r === 'STUDENT' ? 'Student' : 'Admin'}</span>
                </button>
              ))}
            </div>
            {error && <div className="error" role="alert">{error}</div>}
            <div className="field auth-field">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" autoComplete="username" placeholder="you@example.com" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field auth-field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" autoComplete="current-password" placeholder="Enter your password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button className="btn btn-primary auth-submit" disabled={busy}>
              {busy ? 'Signing in…' : `Continue as ${role === 'ADMIN' ? 'admin' : 'student'}`}
              {!busy && <span aria-hidden="true">→</span>}
            </button>
            {role === 'STUDENT' ? (
              <>
                <p className="auth-register"><Link to="/forgot-password">Forgot your password?</Link></p>
                <p className="auth-register">New to ProjectVault? <Link to="/register">Create an account</Link></p>
              </>
            ) : (
              <p className="auth-register">Admin access is reserved for authorized administrators.</p>
            )}
            <p className="auth-secure"><span aria-hidden="true">✓</span> Secure sign-in · Your projects stay yours</p>
          </form>
        </div>
      </section>
    </div>
  );
}
