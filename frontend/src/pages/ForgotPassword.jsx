import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../services/api';

export default function ForgotPassword() {
  const [form, setForm] = useState({ email: '', dateOfBirth: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function resetPassword(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (form.newPassword !== form.confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/auth/password-reset', {
        email: form.email,
        dateOfBirth: form.dateOfBirth,
        newPassword: form.newPassword,
      });
      setMessage('Password updated. You can now sign in using your email.');
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
          <p className="auth-kicker">ACCOUNT RECOVERY</p>
          <h1>Get back to your work.</h1>
          <p className="auth-description">Confirm your student email and date of birth, then choose a new password.</p>
        </div>
        <p className="auth-footer">Your date of birth is checked privately by ProjectVault and is never shown on your profile.</p>
      </section>
      <section className="auth-form">
        <div className="auth-form-inner">
          <form onSubmit={resetPassword}>
            <p className="auth-form-kicker">STUDENT ACCOUNT</p>
            <h2>Reset your password</h2>
            <p className="auth-form-intro">Enter the email and date of birth on your student account.</p>
            {error && <div className="error" role="alert">{error}</div>}
            {message && <p className="student-search-notice" role="status">{message}</p>}
            <div className="field auth-field">
              <label htmlFor="reset-email">Student email</label>
              <input id="reset-email" type="email" required autoComplete="email" value={form.email}
                onChange={set('email')} />
            </div>
            <div className="field auth-field">
              <label htmlFor="reset-dob">Date of birth</label>
              <input id="reset-dob" type="date" required max={new Date().toISOString().slice(0, 10)}
                value={form.dateOfBirth} onChange={set('dateOfBirth')} />
            </div>
            <div className="field auth-field">
              <label htmlFor="new-password">New password (8+ characters)</label>
              <input id="new-password" type="password" minLength={8} maxLength={72} required
                autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} />
            </div>
            <div className="field auth-field">
              <label htmlFor="confirm-password">Confirm new password</label>
              <input id="confirm-password" type="password" minLength={8} maxLength={72} required
                autoComplete="new-password" value={form.confirmPassword} onChange={set('confirmPassword')} />
            </div>
            <button className="btn btn-primary auth-submit" disabled={busy}>
              {busy ? 'Updating password…' : 'Update password'}
            </button>
            {message && <Link className="btn auth-submit" to="/login">Return to sign in</Link>}
            <p className="auth-register"><Link to="/login">Back to sign in</Link></p>
          </form>
        </div>
      </section>
    </div>
  );
}
