import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProjectStars from '../components/ProjectStars';
import api, { errMsg, formatDate } from '../services/api';

export default function AdminReviews() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'ADMIN' && !user?.department;
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isSuperAdmin) return undefined;
    let active = true;
    api.get('/projects/reviews')
      .then(({ data }) => { if (active) setProjects(data); })
      .catch((err) => {
        if (!active) return;
        const message = errMsg(err);
        setError(err.response?.status === 400 && message.includes('convert')
          ? 'The running backend does not yet have the scoped project review endpoint. Restart it using the updated application source.'
          : err.response?.status === 404 && message.includes('No static resource')
            ? 'The project review queue is not available on the running backend yet. Restart it using the updated application source.'
            : message);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isSuperAdmin]);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return projects.filter((project) =>
      `${project.title} ${project.ownerName} ${project.category || ''}`.toLocaleLowerCase().includes(term));
  }, [projects, query]);
  if (isSuperAdmin) return <Navigate to="/admin" replace />;

  return (
    <section className="admin-dashboard admin-management-page">
      <header className="admin-dashboard-hero">
        <div className="admin-dashboard-copy">
          <p className="workspace-eyebrow">PUBLIC PROJECTS · RATING &amp; FEEDBACK</p>
          <h1>Project reviews</h1>
          <p>{isSuperAdmin ? 'Review eligible public projects across the institute.' : `Review public projects submitted by students in ${user?.department || 'your department'}.`}</p>
          <div className="admin-scope-badges"><span>Public projects only</span><span>1–5 star rating</span></div>
        </div>
        <div className="admin-dashboard-mark" aria-hidden="true">★</div>
      </header>
      {error && <div className="error" role="alert">{error}</div>}
      <div className="admin-list-toolbar">
        <div><p className="workspace-eyebrow">REVIEW QUEUE</p><h2>{loading ? 'Loading eligible projects…' : error ? 'Review queue unavailable' : `${filtered.length} eligible projects`}</h2></div>
        <label className="admin-search"><span aria-hidden="true">⌕</span>
          <input type="search" aria-label="Search projects for review" placeholder="Search title, owner, category"
            value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>
      <section className="card admin-list-card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Project</th><th>Student</th><th>Category</th><th>Rating</th><th>Updated</th><th></th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="muted">Loading review queue…</td></tr>}
              {!loading && filtered.map((project) => (
                <tr key={project.id}>
                  <td><strong><Link to={`/projects/${project.id}`}>{project.title}</Link></strong></td>
                  <td>{project.ownerName}</td>
                  <td>{project.category || '—'}</td>
                  <td><ProjectStars value={project.starRating} /></td>
                  <td>{formatDate(project.updatedAt)}</td>
                  <td><Link className="btn btn-sm btn-primary" to={`/projects/${project.id}`}>{project.starRating ? 'Update review' : 'Review project'}</Link></td>
                </tr>
              ))}
              {!loading && !error && !filtered.length && <tr><td colSpan="6" className="muted">{query ? 'No eligible projects match your search.' : 'No public projects are eligible for review in your scope yet.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <p className="muted admin-policy-note">Ratings and grading are rechecked by the backend. Private and department-only projects are never eligible for this review queue.</p>
      <Link to="/admin" className="btn">← Back to overview</Link>
    </section>
  );
}
