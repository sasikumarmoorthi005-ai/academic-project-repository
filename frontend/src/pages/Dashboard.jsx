import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { errMsg } from '../services/api';
import ProjectCard from '../components/ProjectCard';
import Illustration from '../components/Illustration';
import ProjectActivityFeed from '../components/ProjectActivityFeed';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [shared, setShared] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) return;
    Promise.all([api.get('/projects'), api.get('/projects/shared')])
      .then(([mine, pub]) => { setProjects(mine.data); setShared(pub.data); })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (isAdmin) return <Navigate to="/admin" replace />;

  const versions = projects.reduce((n, p) => n + p.versionCount, 0);
  const files = projects.reduce((n, p) => n + p.fileCount, 0);
  const visibleShared = shared.slice(0, 3);
  const discoverableCount = projects.filter((project) => project.visibility !== 'PRIVATE').length;

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="workspace-eyebrow">YOUR PROJECT WORKSPACE</p>
          <h1>Welcome back,<br /><span>{user.name.split(' ')[0]}.</span></h1>
          <p>Your ideas, project files, and progress—together in one organized workspace.</p>
          {user.department && (
            <span className="dashboard-department"><span aria-hidden="true">⌖</span>{user.department}<i />STUDENT WORKSPACE</span>
          )}
        </div>
        <div className="dashboard-hero-actions">
          <Link to="/projects/new" className="btn btn-primary"><span aria-hidden="true">＋</span> Create a project</Link>
          <Link to="/projects" className="dashboard-secondary-link">Browse my projects <span aria-hidden="true">→</span></Link>
        </div>
        <div className="dashboard-hero-art" aria-hidden="true">
          <div className="dashboard-orbit dashboard-orbit-one" />
          <div className="dashboard-orbit dashboard-orbit-two" />
          <div className="dashboard-art-sheet"><span>PV</span><i /><i /><i /></div>
          <span className="dashboard-art-spark">✦</span>
        </div>
      </section>
      {error && <div className="error">{error}</div>}
      <div className="dashboard-stats">
        <div className="dashboard-stat-card"><span className="dashboard-stat-icon">▧</span><span className="dashboard-stat-label">Projects</span><strong>{projects.length}</strong><small>In your personal vault</small></div>
        <div className="dashboard-stat-card"><span className="dashboard-stat-icon dashboard-stat-icon-blue">▤</span><span className="dashboard-stat-label">Files</span><strong>{files}</strong><small>Across all your projects</small></div>
        <div className="dashboard-stat-card"><span className="dashboard-stat-icon dashboard-stat-icon-gold">↻</span><span className="dashboard-stat-label">Versions</span><strong>{versions}</strong><small>Progress saved over time</small></div>
        <div className="dashboard-stat-card"><span className="dashboard-stat-icon dashboard-stat-icon-green">↗</span><span className="dashboard-stat-label">Shared projects</span><strong>{discoverableCount}</strong><small>Visible beyond your vault</small></div>
      </div>

      <div className="dashboard-primary-grid">
        <section className="dashboard-section dashboard-project-section">
          <div className="dashboard-section-heading">
            <div>
              <p className="workspace-eyebrow">YOUR WORKSPACE</p>
              <h2>Recently updated</h2>
              <p className="muted">Your latest work, ready when you are.</p>
            </div>
            <Link className="dashboard-section-link" to="/projects">All projects <span aria-hidden="true">→</span></Link>
          </div>
          {loading ? <div className="dashboard-loading"><i /><i /><i /></div> : projects.length === 0 ? (
            <div className="card empty empty-illustrated dashboard-empty">
              <Illustration type="empty" className="empty-illustration" />
              <p className="workspace-eyebrow">A FRESH START</p>
              <h2>Your project space is ready</h2>
              <p className="muted">Create your first project to keep its files, notes, and versions together.</p>
              <Link to="/projects/new" className="btn btn-primary">Create your first project</Link>
            </div>
          ) : (
            <div className="grid">{projects.slice(0, 2).map((project) => <ProjectCard key={project.id} project={project} />)}</div>
          )}
        </section>

        <aside className="dashboard-activity-section">
          <ProjectActivityFeed limit={5} />
        </aside>
      </div>

      <section className="dashboard-section dashboard-community-section">
        <div className="dashboard-section-heading">
          <div>
            <p className="workspace-eyebrow">{user.department || 'PROJECTVAULT COMMUNITY'}</p>
            <h2>Ideas from your community</h2>
            <p className="muted">A little inspiration from students across ProjectVault.</p>
          </div>
          <Link className="dashboard-section-link" to="/projects">Explore projects <span aria-hidden="true">→</span></Link>
        </div>
        {loading ? <p className="muted">Loading shared projects…</p> : visibleShared.length ? (
          <div className="grid">{visibleShared.map((project) => <ProjectCard key={project.id} project={project} />)}</div>
        ) : (
          <div className="dashboard-community-empty">
            <span aria-hidden="true">✦</span>
            <p>No projects have been shared with you yet.</p>
            <Link to="/students">Discover student portfolios <span aria-hidden="true">→</span></Link>
          </div>
        )}
      </section>
    </div>
  );
}
