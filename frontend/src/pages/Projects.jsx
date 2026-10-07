import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { errMsg } from '../services/api';
import ProjectCard from '../components/ProjectCard';
import Illustration from '../components/Illustration';

export default function Projects() {
  const { isAdmin } = useAuth();
  const tabs = [
    { key: 'mine', label: 'My projects', url: '/projects' },
    { key: 'shared', label: 'Shared with everyone', url: '/projects/shared' },
  ];
  const [tab, setTab] = useState(tabs[0]);
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) return;
    setLoading(true);
    setError('');
    api.get(tab.url)
      .then((r) => setProjects(r.data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [tab, isAdmin]);

  const q = query.trim().toLowerCase();
  const visible = projects.filter((p) =>
    !q || [p.title, p.description, p.techStack, p.category, p.ownerName].some((v) => v?.toLowerCase().includes(q))
  );

  if (isAdmin) return <Navigate to="/admin" replace />;

  return (
    <section className="projects-page">
      <header className="projects-hero">
        <div className="projects-hero-copy">
          <p className="workspace-eyebrow">YOUR PROJECT LIBRARY</p>
          <h1>Projects, all in one place.</h1>
          <p>Keep your work organized, follow updates, and discover projects shared by your community.</p>
        </div>
        <div className="projects-hero-actions">
          <span className="projects-count"><strong>{projects.length}</strong> {projects.length === 1 ? 'project' : 'projects'}</span>
          <Link to="/projects/new" className="btn btn-primary"><span aria-hidden="true">+</span> Add project</Link>
        </div>
        <div className="projects-hero-decoration" aria-hidden="true">
          <span className="projects-hero-file">▤</span>
          <span className="projects-hero-orbit" />
        </div>
      </header>

      <div className="projects-toolbar">
        <div className="projects-tabs" role="tablist" aria-label="Project lists">
          {tabs.map((t) => (
            <button type="button" role="tab" aria-selected={tab.key === t.key}
              key={t.key} className={`projects-tab ${tab.key === t.key ? 'on' : ''}`}
              onClick={() => { setTab(t); setQuery(''); }}>
              <span className="projects-tab-icon" aria-hidden="true">{t.key === 'mine' ? '▧' : '↗'}</span>
              {t.label}
            </button>
          ))}
        </div>
        <label className="projects-search">
          <span aria-hidden="true">⌕</span>
          <input placeholder="Search title, technology, category or owner" aria-label="Search projects"
            value={query} onChange={(e) => setQuery(e.target.value)} />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
        </label>
      </div>

      {error && <div className="error">{error}</div>}
      {loading ? <p className="muted">Loading…</p> : visible.length === 0 ? (
        <div className="card empty empty-illustrated projects-empty">
          <Illustration type="empty" className="empty-illustration" />
          <p className="workspace-eyebrow">{query ? 'SEARCH RESULTS' : tab.key === 'mine' ? 'GET STARTED' : 'COMMUNITY PROJECTS'}</p>
          <h2>{query ? 'No projects match that search' : tab.key === 'mine' ? 'Your project space is ready' : 'Nothing shared just yet'}</h2>
          <p className="muted">{query
            ? 'Try another title, technology, category, or owner.'
            : tab.key === 'mine'
              ? 'Create your first project to keep files, notes, and versions together.'
              : 'Public projects from other students will show up here when they share their work.'}</p>
          {query ? (
            <button type="button" className="btn" onClick={() => setQuery('')}>Clear search</button>
          ) : tab.key === 'mine' ? (
            <Link to="/projects/new" className="btn btn-primary">Create your first project</Link>
          ) : (
            <button type="button" className="btn" onClick={() => setTab(tabs[0])}>View my projects</button>
          )}
        </div>
      ) : (
        <>
          <div className="projects-results-heading">
            <div>
              <p className="workspace-eyebrow">{tab.key === 'mine' ? 'YOUR WORKSPACE' : 'FROM THE COMMUNITY'}</p>
              <h2>{tab.label}</h2>
            </div>
            <span>{visible.length} {visible.length === 1 ? 'result' : 'results'}</span>
          </div>
          <div className="grid projects-grid">{visible.map((p) => <ProjectCard key={p.id} project={p} />)}</div>
        </>
      )}
    </section>
  );
}
