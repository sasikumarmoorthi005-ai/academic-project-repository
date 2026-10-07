import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../services/api';
import Illustration from '../components/Illustration';
import FileCategoryInputs from '../components/FileCategoryInputs';
import { uploadCategorizedFiles } from '../services/projectFiles';

/** Shared by AddProject and EditProject. */
const VISIBILITY_OPTIONS = [
  { value: 'PRIVATE', icon: '⌑', label: 'Private', helperText: 'Only you can view this project.' },
  { value: 'DEPARTMENT', icon: '▥', label: 'Department', helperText: 'Students and authorized admins in your department can view this project.' },
  { value: 'PUBLIC', icon: '◎', label: 'Public', helperText: 'Authenticated users from all departments can view this project.' },
];

export function ProjectForm({ initial, submitLabel, onSubmit, showFiles, cancelTo = '/projects' }) {
  const [form, setForm] = useState({
    title: '', description: '', techStack: '', category: 'Web Development', visibility: 'PRIVATE', ...initial,
  });
  const [files, setFiles] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  const selectedVisibility = VISIBILITY_OPTIONS.find((option) => option.value === form.visibility) || VISIBILITY_OPTIONS[0];

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSubmit(form, files);
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  }

  return (
    <form className="project-editor" onSubmit={submit}>
      {error && <div className="error" role="alert">{error}</div>}
      <div className="project-editor-layout">
        <div className="project-editor-main">
          <section className="card project-editor-card">
            <div className="project-editor-section-head">
              <span className="project-editor-step">01</span>
              <div>
                <p className="workspace-eyebrow">PROJECT DETAILS</p>
                <h2>Tell us about your work</h2>
                <p className="muted">Start with the essentials. You can refine them later.</p>
              </div>
            </div>
            <div className="field">
              <label htmlFor="title">Project title <span aria-hidden="true">*</span></label>
              <input id="title" required maxLength={180} value={form.title} onChange={set('title')}
                placeholder="Give your project a clear, memorable name" />
            </div>
            <div className="field">
              <label htmlFor="description">About this project</label>
              <textarea id="description" maxLength={5000} value={form.description || ''} onChange={set('description')}
                placeholder="What does it do? What problem does it solve? Add a short overview." />
              <span className="project-editor-hint">A concise description helps others understand your work.</span>
            </div>
            <div className="row project-editor-fields">
              <div className="field">
                <label htmlFor="tech">Technologies</label>
                <input id="tech" maxLength={500} placeholder="React, Spring Boot, MySQL"
                  value={form.techStack || ''} onChange={set('techStack')} />
              </div>
              <div className="field">
                <label htmlFor="category">Project category</label>
                <select id="category" value={form.category || ''} onChange={set('category')}>
                  {['Web Development', 'Mobile App', 'Machine Learning', 'Data Science', 'IoT', 'Research Paper', 'Other']
                    .map((category) => <option key={category}>{category}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section className="card project-editor-card project-visibility-card">
            <div className="project-editor-section-head">
              <span className="project-editor-step">02</span>
              <div>
                <p className="workspace-eyebrow">SHARING &amp; PRIVACY</p>
                <h2>Choose who can view this project</h2>
                <p className="muted">You can update visibility whenever you want.</p>
              </div>
            </div>
            <div className="visibility-picker" role="radiogroup" aria-label="Project visibility">
              {VISIBILITY_OPTIONS.map((option) => (
                <label key={option.value} className={`visibility-option ${form.visibility === option.value ? 'selected' : ''}`}>
                  <input type="radio" name="project-visibility" value={option.value}
                    checked={form.visibility === option.value} onChange={set('visibility')} />
                  <span className="visibility-option-icon" aria-hidden="true">{option.icon}</span>
                  <span className="visibility-option-body">
                    <strong>{option.label}</strong>
                    <small>{option.helperText}</small>
                  </span>
                  <span className="visibility-option-check" aria-hidden="true">✓</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="project-editor-aside">
          {showFiles && (
            <section className="card project-editor-card project-files-card">
              <div className="project-editor-section-head">
                <span className="project-editor-step">03</span>
                <div>
                  <p className="workspace-eyebrow">PROJECT RESOURCES</p>
                  <h2>Add files</h2>
                  <p className="muted">Optional now—you can upload more later.</p>
                </div>
              </div>
              <FileCategoryInputs idPrefix="project-files" files={files}
                onChange={(category, selected) => setFiles((current) => ({ ...current, [category]: selected }))} />
            </section>
          )}
          <section className="project-visibility-summary">
            <span className="project-visibility-summary-icon" aria-hidden="true">{selectedVisibility.icon}</span>
            <p className="workspace-eyebrow">CURRENT VISIBILITY</p>
            <h3>{selectedVisibility.value === 'PRIVATE' ? 'Private – Only Me'
              : selectedVisibility.value === 'DEPARTMENT' ? 'Department Only' : 'Public – All Departments'}</h3>
            <p>{selectedVisibility.helperText}</p>
            <div className="project-visibility-secure"><span aria-hidden="true">✓</span> Access is protected by your account</div>
          </section>
        </aside>
      </div>
      <footer className="project-editor-footer">
        <Link to={cancelTo} className="project-editor-cancel">Cancel</Link>
        <span className="project-editor-footer-note"><span aria-hidden="true">*</span> Required field</span>
        <button className="btn btn-primary project-editor-save" disabled={busy}>
          {busy ? 'Saving project…' : submitLabel}
          {!busy && <span aria-hidden="true">→</span>}
        </button>
      </footer>
    </form>
  );
}

export default function AddProject() {
  const nav = useNavigate();

  async function create(form, files) {
    const { data } = await api.post('/projects', form);
    await uploadCategorizedFiles(data.id, files);
    nav(`/projects/${data.id}`);
  }

  return (
    <>
      <div className="page-head project-form-heading">
        <div>
          <p className="workspace-eyebrow">PROJECT WORKSPACE · NEW ENTRY</p>
          <h1>Add project</h1>
          <p className="muted">Bring your work together—details, resources, and sharing in one place.</p>
        </div>
        <Illustration type="project" className="form-heading-illustration" />
      </div>
      <ProjectForm submitLabel="Save project" onSubmit={create} showFiles />
    </>
  );
}
