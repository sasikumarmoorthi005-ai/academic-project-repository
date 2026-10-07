import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../services/api';

const EMPTY_SETTINGS = {
  summary: '',
  course: '',
  skills: '',
  profileVisibility: 'PRIVATE',
};

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY_SETTINGS);
  const [recoveryDate, setRecoveryDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recoverySaving, setRecoverySaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/auth/profile')
      .then(({ data }) => {
        if (!active) return;
        setProfile(data);
        setForm({
          summary: data.summary || '',
          course: data.course || '',
          skills: data.skills || '',
          profileVisibility: data.profileVisibility || 'PRIVATE',
        });
      })
      .catch((err) => {
        if (active) setError(errMsg(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function saveSettings(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.put('/auth/profile', form);
      setProfile(data);
      setForm({
        summary: data.summary || '',
        course: data.course || '',
        skills: data.skills || '',
        profileVisibility: data.profileVisibility || 'PRIVATE',
      });
      setMessage('Your profile and privacy settings have been saved.');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  }

  async function saveRecoveryDetails(event) {
    event.preventDefault();
    setRecoverySaving(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.put('/auth/profile/recovery-details', { dateOfBirth: recoveryDate });
      setProfile(data);
      setRecoveryDate('');
      setMessage('Your account recovery details have been saved.');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setRecoverySaving(false);
    }
  }

  if (loading) return <p className="muted">Loading your settings…</p>;

  return (
    <section className="settings-page">
      <header className="settings-hero">
        <div>
          <p className="workspace-eyebrow">ACCOUNT PREFERENCES</p>
          <h1>Settings</h1>
          <p>Manage your profile details, portfolio privacy, and account recovery.</p>
        </div>
        <Link to="/profile" className="settings-profile-link"><span aria-hidden="true">◉</span> View profile</Link>
      </header>
      {error && <div className="error" role="alert">{error}</div>}
      {message && <p className="success-message" role="status">{message}</p>}

      <form className="settings-layout" onSubmit={saveSettings}>
        <div className="settings-main">
          <section className="card settings-card">
            <div className="settings-section-heading">
              <span className="settings-section-icon" aria-hidden="true">◉</span>
              <div>
                <p className="workspace-eyebrow">PROFILE</p>
                <h2>Your details</h2>
                <p className="muted">Choose what appears on your student portfolio.</p>
              </div>
            </div>
            <div className="settings-account-line">
              <span>Department</span><strong>{profile?.department || 'Not assigned'}</strong>
              <small>Contact your administrator if this needs to change.</small>
            </div>
            <div className="field">
              <label htmlFor="settings-course">Course</label>
              <input id="settings-course" maxLength={120} value={form.course}
                placeholder="e.g. B.Sc. Computer Science"
                onChange={(event) => setForm({ ...form, course: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="settings-summary">About you</label>
              <textarea id="settings-summary" maxLength={2000} value={form.summary}
                placeholder="Introduce yourself, your interests, and what you enjoy building."
                onChange={(event) => setForm({ ...form, summary: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="settings-skills">Skills</label>
              <input id="settings-skills" maxLength={500} value={form.skills}
                placeholder="React, Java, UI design"
                onChange={(event) => setForm({ ...form, skills: event.target.value })} />
              <span className="settings-field-hint">Separate skills with commas.</span>
            </div>
          </section>

          <section className="card settings-card">
            <div className="settings-section-heading">
              <span className="settings-section-icon settings-section-icon-purple" aria-hidden="true">◉</span>
              <div>
                <p className="workspace-eyebrow">DISCOVERABILITY</p>
                <h2>Profile privacy</h2>
                <p className="muted">Control whether other signed-in ProjectVault users can find your profile.</p>
              </div>
            </div>
            <div className="settings-privacy-options">
              <label className={`settings-privacy-option ${form.profileVisibility === 'PRIVATE' ? 'selected' : ''}`}>
                <input type="radio" name="profile-visibility" value="PRIVATE"
                  checked={form.profileVisibility === 'PRIVATE'}
                  onChange={(event) => setForm({ ...form, profileVisibility: event.target.value })} />
                <span className="settings-privacy-symbol" aria-hidden="true">⌑</span>
                <span><strong>Private profile</strong><small>Hidden from search and public portfolio links. Your own projects are still available to you.</small></span>
                <i aria-hidden="true">{form.profileVisibility === 'PRIVATE' ? '✓' : ''}</i>
              </label>
              <label className={`settings-privacy-option ${form.profileVisibility === 'PUBLIC' ? 'selected' : ''}`}>
                <input type="radio" name="profile-visibility" value="PUBLIC"
                  checked={form.profileVisibility === 'PUBLIC'}
                  onChange={(event) => setForm({ ...form, profileVisibility: event.target.value })} />
                <span className="settings-privacy-symbol" aria-hidden="true">◎</span>
                <span><strong>Public profile</strong><small>Discoverable by signed-in users. Only projects you mark Public appear on your portfolio.</small></span>
                <i aria-hidden="true">{form.profileVisibility === 'PUBLIC' ? '✓' : ''}</i>
              </label>
            </div>
          </section>
          <div className="settings-save-row">
            <span className="settings-field-hint">Changes apply to your signed-in ProjectVault portfolio.</span>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
          </div>
        </div>

        <aside className="settings-aside">
          <section className="card settings-card settings-recovery-card">
            <div className="settings-section-heading">
              <span className="settings-section-icon settings-section-icon-gold" aria-hidden="true">⌑</span>
              <div>
                <p className="workspace-eyebrow">ACCOUNT SECURITY</p>
                <h2>Recovery details</h2>
              </div>
            </div>
            {profile?.recoveryDetailsComplete ? (
              <div className="settings-recovery-complete">
                <span aria-hidden="true">✓</span>
                <div><strong>Recovery details are set</strong><p>These details help verify your identity if you need to recover your account.</p></div>
              </div>
            ) : (
              <form onSubmit={saveRecoveryDetails}>
                <p className="muted">Add your date of birth to complete account recovery setup.</p>
                <div className="field">
                  <label htmlFor="settings-date-of-birth">Date of birth</label>
                  <input id="settings-date-of-birth" type="date" required max={new Date().toISOString().slice(0, 10)}
                    value={recoveryDate} onChange={(event) => setRecoveryDate(event.target.value)} />
                </div>
                <button className="btn" disabled={recoverySaving}>
                  {recoverySaving ? 'Saving…' : 'Save recovery details'}
                </button>
              </form>
            )}
          </section>
          <div className="settings-privacy-note">
            <span aria-hidden="true">✓</span>
            <p><strong>Your projects stay in your control.</strong> Profile privacy does not override each project's own visibility setting.</p>
          </div>
        </aside>
      </form>
    </section>
  );
}
