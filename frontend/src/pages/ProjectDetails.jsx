import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { downloadFile, errMsg, formatDate, formatSize } from '../services/api';
import { fileCategories } from '../components/FileCategoryInputs';
import ProjectStars from '../components/ProjectStars';
import ProjectActivityFeed from '../components/ProjectActivityFeed';

export default function ProjectDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [starRating, setStarRating] = useState(0);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [ratingMessage, setRatingMessage] = useState('');

  const load = useCallback(() => {
    api.get(`/projects/${id}`).then((r) => {
      setProject(r.data);
      if (isAdmin) {
        setStarRating(r.data.starRating || 0);
      }
    }).catch((e) => setError(errMsg(e)));
  }, [id, isAdmin]);

  useEffect(load, [load]);

  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
  }, [preview?.url]);

  if (error && !project) return <div className="error">{error}</div>;
  if (!project) return <p className="muted">Loading…</p>;

  const canEdit = !isAdmin && project.ownerId === user.id;

  async function removeFile(file) {
    if (!window.confirm(`Delete ${file.fileName}?`)) return;
    try { await api.delete(`/files/${file.id}`); load(); } catch (err) { setError(errMsg(err)); }
  }

  async function removeProject() {
    if (!window.confirm('Delete this project and all of its files? This cannot be undone.')) return;
    try { await api.delete(`/projects/${id}`); nav('/projects'); } catch (err) { setError(errMsg(err)); }
  }

  async function saveRating(e) {
    e.preventDefault();
    if (!starRating) {
      setError('Choose a star rating before saving.');
      return;
    }
    setRatingBusy(true);
    setError('');
    setRatingMessage('');
    try {
      const { data } = await api.put(`/projects/${id}/rating`, { rating: starRating });
      setProject(data);
      setStarRating(data.starRating || 0);
      setRatingMessage('The project rating has been saved.');
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.response?.data?.error || err.message || '';
      setError(err.response?.status === 404 && serverMessage.includes('No static resource')
        ? 'The running backend does not have the star-rating endpoint yet. Restart the backend using the latest source code, then try again.'
        : errMsg(err));
    } finally {
      setRatingBusy(false);
    }
  }

  async function removeRating() {
    if (!window.confirm('Remove the saved rating from this public project?')) return;
    setRatingBusy(true);
    setError('');
    setRatingMessage('');
    try {
      const { data } = await api.delete(`/projects/${id}/rating`);
      setProject(data);
      setStarRating(0);
      setRatingMessage('The project rating has been removed.');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setRatingBusy(false);
    }
  }

  async function download(file) {
    try { await downloadFile(file); } catch (err) { setError(errMsg(err)); }
  }

  async function viewFile(file) {
    setError('');
    setPreview({ file, kind: 'loading' });
    setPreviewBusy(true);
    try {
      const { data } = await api.get(`/files/${file.id}/download`, { responseType: 'blob' });
      const contentType = file.fileType || data.type || 'application/octet-stream';
      if (contentType.startsWith('text/') || contentType === 'application/json') {
        setPreview({ file, kind: 'text', content: await data.text() });
      } else if (contentType === 'application/pdf' || contentType.startsWith('image/')) {
        const url = URL.createObjectURL(new Blob([data], { type: contentType }));
        setPreview({ file, kind: 'media', url });
      } else {
        setPreview({ file, kind: 'unsupported' });
      }
    } catch (err) {
      setPreview(null);
      setError(errMsg(err));
    } finally {
      setPreviewBusy(false);
    }
  }

  const FileRow = ({ f }) => (
    <div className="file-row">
      <div className="file-row-info">
        <span className="file-mark" aria-hidden="true">↳</span>
        <span className="file-row-name">
          <strong title={f.fileName}>{f.fileName}</strong>
          <span className="file-row-meta">
            {formatSize(f.size)}
          </span>
        </span>
        <span className="badge file-category-badge">
          {fileCategories.find((category) => category.value === f.category)?.label || 'Other files'}
        </span>
      </div>
      <div className="file-row-actions">
        <button className="btn btn-sm" onClick={() => download(f)}>Download</button>{' '}
        {canEdit && <button className="btn btn-sm btn-danger" onClick={() => removeFile(f)}>Delete</button>}
      </div>
    </div>
  );

  return (
    <div className="project-details-page">
      <header className="project-detail-hero">
        <div className="project-detail-hero-main">
          <p className="workspace-eyebrow">PROJECT WORKSPACE</p>
          <h1>{project.title}</h1>
          <p className="project-detail-subtitle">A central space for project files, documentation and progress.</p>
          <div className="project-detail-meta">
            <span className="project-owner-mark" aria-hidden="true">
              {(project.ownerName || '?').trim().charAt(0).toUpperCase()}
            </span>
            <span>By <strong>{project.ownerName}</strong></span>
            {project.category && <span className="badge">{project.category}</span>}
            <span className={`badge ${project.visibility === 'PUBLIC' ? 'public' : project.visibility === 'DEPARTMENT' ? 'department' : ''}`}>
              {project.visibility === 'PUBLIC' ? 'Public – All Departments' : project.visibility === 'DEPARTMENT' ? 'Department Only' : 'Private – Only Me'}
            </span>
            <span className="project-updated">Updated {formatDate(project.updatedAt)}</span>
          </div>
        </div>
        <div className="project-detail-actions">
          {canEdit && (
            <>
              <Link to={`/projects/${id}/edit`} className="btn">Edit project</Link>
              <button className="btn btn-danger" onClick={removeProject}>Delete</button>
            </>
          )}
        </div>
        <div className="project-detail-stats" aria-label="Project summary">
          <div><strong>{project.versionCount}</strong><span>Versions</span></div>
          <div><strong>{project.fileCount}</strong><span>Files</span></div>
        </div>
      </header>

      {error && <div className="error" role="alert">{error}</div>}

      {isAdmin && project.reviewEligible && (
        <form className="project-star-rating-card" onSubmit={saveRating}>
          <div>
            <p className="profile-eyebrow">PUBLIC PROJECT RANKING</p>
            <h2>Rate this project</h2>
            <p className="muted">Your 1–5 star rating will be visible to students.</p>
            <ProjectStars value={starRating} onChange={setStarRating} disabled={ratingBusy} />
            {ratingMessage && <p className="success-message" role="status">{ratingMessage}</p>}
          </div>
          <div className="project-rating-actions">
            <button className="btn btn-primary" disabled={ratingBusy || !starRating}>
              {ratingBusy ? 'Saving…' : project.starRating ? 'Update rating' : 'Save rating'}
            </button>
            {project.starRating != null && (
              <button type="button" className="btn btn-danger" disabled={ratingBusy} onClick={removeRating}>
                Remove rating
              </button>
            )}
          </div>
        </form>
      )}
      {isAdmin && !project.reviewEligible && (
        <section className="project-star-rating-card">
          <div>
            <p className="profile-eyebrow">REVIEW ELIGIBILITY</p>
            <h2>This project is outside your review scope</h2>
            <p className="muted">Admin ratings are limited to public projects in your authorized review scope.</p>
          </div>
        </section>
      )}

      {!isAdmin && project.visibility === 'PUBLIC' && project.starRating != null && (
        <section className="project-student-rating">
          <div>
            <p className="workspace-eyebrow">ADMIN RATING</p>
            <h2>Project rating</h2>
          </div>
          <ProjectStars value={project.starRating} />
        </section>
      )}

      <ProjectActivityFeed projectId={id} />

      <section className="project-about-card">
        <div className="section-heading">
          <span className="section-icon" aria-hidden="true">i</span>
          <div><p className="workspace-eyebrow">OVERVIEW</p><h2>About this project</h2></div>
        </div>
        <p className="project-description">{project.description || 'No description has been added yet.'}</p>
        {project.techStack && (
          <div className="project-tech-row">
            <span className="project-tech-label">Built with</span>
            {project.techStack.split(',').map((technology) => technology.trim()).filter(Boolean)
              .map((technology) => <span className="tech-chip" key={technology}>{technology}</span>)}
          </div>
        )}
      </section>

      <section className="project-file-library">
        <div className="version-history-heading">
          <div className="section-heading">
            <span className="section-icon" aria-hidden="true">▤</span>
            <div>
              <p className="workspace-eyebrow">PROJECT RESOURCES</p>
              <h2>Files</h2>
            </div>
          </div>
          <span className="version-total">{project.files.length} {project.files.length === 1 ? 'file' : 'files'}</span>
        </div>
        {project.files.length === 0 ? (
          <p className="version-empty">No files have been uploaded to this project yet.</p>
        ) : (
          <div className="project-file-groups">
            {[...fileCategories, { value: 'OTHER', label: 'Other files' }].map((category) => {
              const categoryFiles = project.files.filter(
                (file) => (file.category || 'OTHER') === category.value,
              );
                if (category.value === 'OTHER' && !categoryFiles.length) return null;
              return (
                <div className="project-file-group" key={category.value}>
                  <div className="project-file-group-heading">
                    <h3>{category.label}</h3>
                    <span>{categoryFiles.length}</span>
                  </div>
                  {categoryFiles.length ? categoryFiles.map((file) => (
                    <div className="library-file-row" key={file.id}>
                      <div className="file-row-info">
                        <span className="file-mark" aria-hidden="true">
                          {category.value === 'SOURCE_CODE' ? '</>' : category.value === 'DOCUMENTATION' ? 'Aa' : '▤'}
                        </span>
                        <span className="file-row-name">
                          <strong title={file.fileName}>{file.fileName}</strong>
                          <span className="file-row-meta">
                            {formatSize(file.size)}{file.versionId ? ' · Saved with a version' : ' · Project file'}
                          </span>
                        </span>
                      </div>
                      <div className="file-row-actions">
                        <button type="button" className="btn btn-sm" disabled={previewBusy}
                          onClick={() => viewFile(file)}>View</button>
                        <button type="button" className="btn btn-sm btn-primary"
                          onClick={() => download(file)}>Download</button>
                      </div>
                    </div>
                  )) : <p className="project-file-empty">No {category.label.toLowerCase()} uploaded yet.</p>}
                </div>
              );
            })}
          </div>
        )}
        {preview && (
          <div className="file-preview">
            <div className="file-preview-heading">
              <div>
                <p className="workspace-eyebrow">FILE PREVIEW</p>
                <h3 title={preview.file.fileName}>{preview.file.fileName}</h3>
              </div>
              <button type="button" className="btn btn-sm" onClick={() => setPreview(null)}>Close</button>
            </div>
            {preview.kind === 'loading' && <p className="muted">Loading preview…</p>}
            {preview.kind === 'text' && <pre className="file-preview-text">{preview.content}</pre>}
            {preview.kind === 'media' && (preview.file.fileType || '').startsWith('image/') ? (
              <img className="file-preview-image" src={preview.url} alt={preview.file.fileName} />
            ) : null}
            {preview.kind === 'media' && preview.file.fileType === 'application/pdf' ? (
              <iframe className="file-preview-frame" src={preview.url} title={`Preview of ${preview.file.fileName}`} />
            ) : null}
            {preview.kind === 'unsupported' && (
              <div className="file-preview-unsupported">
                <p>This file type can’t be previewed in the browser.</p>
                <button type="button" className="btn btn-primary" onClick={() => download(preview.file)}>
                  Download file
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="version-history-card">
        <div className="version-history-heading">
          <div className="section-heading">
            <span className="section-icon" aria-hidden="true">↻</span>
            <div><p className="workspace-eyebrow">PROJECT ACTIVITY</p><h2>Version history</h2></div>
          </div>
          <span className="version-total">{project.versions.length} {project.versions.length === 1 ? 'version' : 'versions'}</span>
        </div>
        {project.versions.length === 0 && <p className="version-empty">No versions have been saved yet.</p>}
        <div className="version-list">
          {project.versions.map((v, index) => {
            const versionFiles = project.files.filter((f) => f.versionId === v.id);
            return (
              <article className={`version-card ${index === 0 ? 'version-card-latest' : ''}`} key={v.id}>
                <div className="version-marker" aria-hidden="true">{index === 0 ? '✓' : v.versionNumber}</div>
                <div className="version-card-content">
                  <div className="version-card-heading">
                    <div>
                      <span className="version-label">Version {v.versionNumber}</span>
                      {index === 0 && <span className="latest-badge">Latest</span>}
                    </div>
                    <time className="version-date">{formatDate(v.createdAt)}</time>
                  </div>
                  <p className="version-notes">{v.notes}</p>
                  <div className="version-card-summary">
                    <span>{versionFiles.length} {versionFiles.length === 1 ? 'file' : 'files'}</span>
                  </div>
                  {versionFiles.length > 0 ? (
                    <div className="version-files">
                      {versionFiles.map((f) => <FileRow key={f.id} f={f} />)}
                    </div>
                  ) : <p className="version-no-files">No files attached to this version.</p>}
                </div>
              </article>
            );
          })}
        </div>
        {project.files.some((f) => !f.versionId) && (
          <div className="version-card unversioned-card">
            <div className="version-marker" aria-hidden="true">•</div>
            <div className="version-card-content">
              <div className="version-card-heading"><span className="version-label">Project files</span></div>
              <p className="version-notes">Files not linked to a specific version</p>
              <div className="version-files">
                {project.files.filter((f) => !f.versionId).map((f) => <FileRow key={f.id} f={f} />)}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
