import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../services/api';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', dateOfBirth: '', password: '', department: 'Computer Science' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form.name, form.email, form.dateOfBirth, form.password, form.department);
      nav('/dashboard');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth-side">
        <div className="auth-brand">
          <img className="auth-brand-logo" src="/projectvault-mark.svg" alt="" />
          <span className="brand-wordmark">Project<span>Vault</span><small>ACADEMIC PROJECT REPOSITORY</small></span>
        </div>
        <div className="auth-story">
          <p className="auth-kicker">START YOUR PORTFOLIO</p>
          <h1>Create your student account</h1>
          <p className="auth-description">Upload projects, keep a version history and share work with classmates and teachers.</p>
        </div>
        <p className="auth-footer">A focused home for your academic journey.</p>
      </section>
      <section className="auth-form">
        <form onSubmit={submit}>
          <h2>Register</h2>
          {error && <div className="error" role="alert">{error}</div>}
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" required value={form.name} onChange={set('name')} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={form.email} onChange={set('email')} />
          </div>
          <div className="field">
            <label htmlFor="dateOfBirth">Date of birth (for account recovery)</label>
            <input id="dateOfBirth" type="date" required max={new Date().toISOString().slice(0, 10)}
              value={form.dateOfBirth} onChange={set('dateOfBirth')} />
          </div>
          <div className="field">
            <label htmlFor="department">Department</label>
            <select id="department" value={form.department} onChange={set('department')}>
              {['Computer Science', 'Information Technology', 'Electronics and Communication', 'Mechanical Engineering', 'Civil Engineering'].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="password">Password (8+ characters)</label>
            <input id="password" type="password" minLength={8} required value={form.password} onChange={set('password')} />
          </div>
          <button className="btn btn-primary" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
          <p className="muted">Already registered? <Link to="/login">Sign in</Link></p>
        </form>
      </section>
    </div>
  );
}
