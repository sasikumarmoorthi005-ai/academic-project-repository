import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../services/api';
import { ProjectForm } from './AddProject';
import FileCategoryInputs from '../components/FileCategoryInputs';
import { uploadCategorizedFiles } from '../services/projectFiles';

export default function EditProject() {
  const { id } = useParams();
  const nav = useNavigate();
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [versionError, setVersionError] = useState('');
  const [versionSuccess, setVersionSuccess] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState({});
  const [versionBusy, setVersionBusy] = useState(false);

  useEffect(() => {
    api.get(`/projects/${id}`).then((r) => setProject(r.data)).catch((e) => setError(errMsg(e)));
  }, [id]);

  async function save(form) {
    await api.put(`/projects/${id}`, form);
    nav(`/projects/${id}`);
  }

  async function saveVersion(event) {
    event.preventDefault();
    setVersionBusy(true);
    setVersionError('');
    setVersionSuccess('');
    try {
      const { data: version } = await api.post(`/projects/${id}/versions`, { notes });
      await uploadCategorizedFiles(id, files, version.id);
      setNotes('');
      setFiles({});
      event.target.reset();
      setVersionSuccess(`Version ${version.versionNumber} saved.`);
      const { data } = await api.get(`/projects/${id}`);
      setProject(data);
    } catch (err) {
      setVersionError(errMsg(err));
    } finally {
      setVersionBusy(false);
    }
  }

  if (error) return <div className="error">{error}</div>;
  if (!project) return <p className="muted">Loading…</p>;

  return (
    <>
      <div className="page-head">
        <div>
          <p className="workspace-eyebrow">PROJECT WORKSPACE</p>
          <h1>Edit project</h1>
          <p className="muted">Update project details or add a new version with its files.</p>
        </div>
        <button type="button" className="btn" onClick={() => nav(`/projects/${id}`)}>Back to project</button>
      </div>
      <ProjectForm initial={project} submitLabel="Save changes" onSubmit={save}
        cancelTo={`/projects/${id}`} />
      <form className="version-create-card edit-version-card" onSubmit={saveVersion}>
        {versionError && <div className="error" role="alert">{versionError}</div>}
        {versionSuccess && <div className="success-message" role="status">{versionSuccess}</div>}
        <div className="section-heading">
          <span className="section-icon section-icon-accent" aria-hidden="true">+</span>
          <div>
            <p className="workspace-eyebrow">PROJECT HISTORY</p>
            <h2>Save a new version</h2>
            <p className="muted">Add a note and attach the files that changed.</p>
          </div>
        </div>
        <div className="field version-notes-field">
          <label htmlFor="version-notes">What changed?</label>
          <input id="version-notes" required value={notes} placeholder="e.g. Added project documentation"
            onChange={(event) => setNotes(event.target.value)} />
        </div>
        <div className="field version-upload-field">
          <p className="file-upload-heading">Attach files <span className="muted">(optional)</span></p>
          <FileCategoryInputs idPrefix="edit-version-files" files={files}
            onChange={(category, selected) => setFiles((current) => ({ ...current, [category]: selected }))} />
        </div>
        <div className="version-submit-row">
          <span className="muted">Files are organized by type and saved with this version.</span>
          <button className="btn btn-primary" disabled={versionBusy}>
            {versionBusy ? 'Saving…' : 'Save version'}
          </button>
        </div>
      </form>
    </>
  );
}
