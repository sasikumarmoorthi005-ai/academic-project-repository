import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { errMsg } from '../services/api';
import ProjectActivityFeed from '../components/ProjectActivityFeed';
import ActivityHeatmap from '../components/ActivityHeatmap';

function elapsedTime(value) {
  if (!value) return 'unknown';
  const elapsedDays = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
  if (elapsedDays < 1) return 'less than a day';
  if (elapsedDays < 30) return `${elapsedDays} ${elapsedDays === 1 ? 'day' : 'days'}`;
  const months = Math.floor(elapsedDays / 30);
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'}`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return `${years} ${years === 1 ? 'year' : 'years'}${remainingMonths ? `, ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}` : ''}`;
}

function getMaintenanceTip(project) {
  const daysSinceUpdate = project.updatedAt
    ? Math.floor((Date.now() - new Date(project.updatedAt).getTime()) / 86400000)
    : null;

  if (!project.fileCount) {
    return 'Add a README or key project files so you can quickly pick up where you left off.';
  }
  if (daysSinceUpdate !== null && daysSinceUpdate >= 30) {
    return 'It has been a while since the last update. Review the project and save a new version with your latest changes.';
  }
  if ((project.versionCount || 0) < 2) {
    return 'Save a new version after your next meaningful change to keep a useful project history.';
  }
  if (project.visibility === 'PUBLIC') {
    return 'Review the description and shared files occasionally to keep your public portfolio accurate.';
  }
  return 'Keep files organized and save a new version whenever important work changes.';
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function activityMonths(now) {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: monthKey(date),
      label: date.toLocaleDateString(undefined, { month: 'short' }),
      projects: 0,
      profile: 0,
      versions: 0,
      uploads: 0,
    };
  });
}

export default function ActivityInsights() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [projectDetails, setProjectDetails] = useState([]);
  const [profileActivity, setProfileActivity] = useState([]);
  const [projectActivity, setProjectActivity] = useState([]);
  const [error, setError] = useState('');
  const [profileActivityWarning, setProfileActivityWarning] = useState('');
  const [projectActivityWarning, setProjectActivityWarning] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadInsights() {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/projects');
        const details = await Promise.all(data.map(async (project) => {
          const response = await api.get(`/projects/${project.id}`);
          return response.data;
        }));
        let projectEvents = [];
        try {
          const response = await api.get('/projects/activity');
          projectEvents = response.data;
          if (active) setProjectActivityWarning('');
        } catch (activityError) {
          if (active) {
            setProjectActivityWarning(
              `Project activity is unavailable from the running backend: ${errMsg(activityError)}. Restart the backend using the latest source.`,
            );
          }
        }
        let profileEvents = [];
        try {
          const response = await api.get('/auth/profile/activity');
          profileEvents = response.data;
          if (active) setProfileActivityWarning('');
        } catch (activityError) {
          const message = errMsg(activityError);
          if (active) {
            setProfileActivityWarning(activityError.response?.status === 404 && message.includes('No static resource')
              ? 'Profile activity tracking is not available on the running backend yet. Restart it using the updated project source to include profile updates in this chart.'
              : `Profile activity could not be loaded: ${message}`);
          }
        }
        if (active) {
          setProjects(data);
          setProjectDetails(details);
          setProfileActivity(profileEvents);
          setProjectActivity(projectEvents);
        }
      } catch (err) {
        if (active) setError(errMsg(err));
      } finally {
        if (active) setLoading(false);
      }
    }
    loadInsights();
    return () => { active = false; };
  }, []);

  const insights = useMemo(() => {
    const publicCount = projects.filter((project) => project.visibility === 'PUBLIC').length;
    const privateCount = projects.length - publicCount;
    const chartMonths = activityMonths(new Date());
    const monthsByKey = new Map(chartMonths.map((month) => [month.key, month]));

    profileActivity.forEach((event) => {
      if (!event.createdAt) return;
      const month = monthsByKey.get(monthKey(new Date(event.createdAt)));
      if (month) month.profile += 1;
    });

    projectActivity.forEach((event) => {
      if (!event.createdAt) return;
      const month = monthsByKey.get(monthKey(new Date(event.createdAt)));
      if (!month) return;
      if (event.activityType === 'PROJECT_CREATED' || event.activityType === 'PROJECT_UPDATED') month.projects += 1;
      if (event.activityType === 'VERSION_SAVED') month.versions += 1;
      if (event.activityType === 'FILE_UPLOADED') month.uploads += 1;
    });

    if (!projectActivity.length && projectDetails.length) {
      projects.forEach((project) => {
        if (!project.createdAt) return;
        const month = monthsByKey.get(monthKey(new Date(project.createdAt)));
        if (month) month.projects += 1;
      });
      projectDetails.forEach((project) => {
        (project.versions || []).forEach((version) => {
          if (!version.createdAt) return;
          const month = monthsByKey.get(monthKey(new Date(version.createdAt)));
          if (month) month.versions += 1;
        });
        (project.files || []).forEach((file) => {
          if (!file.uploadedAt) return;
          const month = monthsByKey.get(monthKey(new Date(file.uploadedAt)));
          if (month) month.uploads += 1;
        });
      });
    }

    const totals = chartMonths.reduce((result, month) => ({
      projects: result.projects + month.projects,
      profile: result.profile + month.profile,
      versions: result.versions + month.versions,
      uploads: result.uploads + month.uploads,
    }), { projects: 0, profile: 0, versions: 0, uploads: 0 });
    const activityTotal = totals.projects + totals.profile + totals.versions + totals.uploads;
    const maxActivity = Math.max(1, ...chartMonths.map((month) =>
      Math.max(month.projects, month.profile, month.versions, month.uploads)));
    return {
      publicCount,
      privateCount,
      files: projects.reduce((total, project) => total + (project.fileCount || 0), 0),
      versions: projects.reduce((total, project) => total + (project.versionCount || 0), 0),
      chartMonths,
      totals,
      activityTotal,
      maxActivity,
      sharedPercent: projects.length ? Math.round((publicCount / projects.length) * 100) : 0,
    };
  }, [projects, projectDetails, profileActivity, projectActivity]);

  if (isAdmin) return <Navigate to="/admin" replace />;

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 3);

  return (
    <section className="activity-page">
      <header className="activity-hero">
        <div>
          <p className="workspace-eyebrow">YOUR PORTFOLIO, AT A GLANCE</p>
          <h1>Activity &amp; insights</h1>
          <p>See how your projects are growing, organized, and shared.</p>
        </div>
        <Link className="btn btn-primary" to="/projects/new">＋ Add project</Link>
        <span className="activity-hero-orbit" aria-hidden="true" />
      </header>

      {error && <div className="error" role="alert">{error}</div>}
      {projectActivityWarning && <div className="activity-warning" role="status">{projectActivityWarning}</div>}
      {profileActivityWarning && <div className="activity-warning" role="status">{profileActivityWarning}</div>}
      {loading ? <p className="muted">Gathering your project insights…</p> : (
        <>
          <div className="activity-stat-grid">
            <article className="activity-stat-card">
              <span className="activity-stat-icon activity-icon-projects" aria-hidden="true">▧</span>
              <span className="activity-stat-label">Your projects</span>
              <strong>{projects.length}</strong>
              <span className="activity-stat-note">{insights.publicCount} shared · {insights.privateCount} private</span>
            </article>
            <article className="activity-stat-card">
              <span className="activity-stat-icon activity-icon-files" aria-hidden="true">▤</span>
              <span className="activity-stat-label">Files stored</span>
              <strong>{insights.files}</strong>
              <span className="activity-stat-note">Across your project library</span>
            </article>
            <article className="activity-stat-card">
              <span className="activity-stat-icon activity-icon-versions" aria-hidden="true">↻</span>
              <span className="activity-stat-label">Versions saved</span>
              <strong>{insights.versions}</strong>
              <span className="activity-stat-note">Your project history</span>
            </article>
            <article className="activity-stat-card">
              <span className="activity-stat-icon activity-icon-sharing" aria-hidden="true">↗</span>
              <span className="activity-stat-label">Sharing ratio</span>
              <strong>{insights.sharedPercent}%</strong>
              <span className="activity-stat-note">Of your projects are public</span>
            </article>
          </div>

          <ActivityHeatmap title="Your activity calendar" eyebrow="YOUR WORK · LAST 12 MONTHS" />

          <div className="activity-insights-grid">
            <section className="activity-panel activity-chart-panel">
              <div className="activity-panel-heading">
                <div>
                  <p className="workspace-eyebrow">CONSISTENCY</p>
                  <h2>Project activity</h2>
                </div>
              </div>
              <p className="activity-panel-subtitle">
                Projects added, profile details or photos updated, versions saved, and files uploaded over the last six months.
              </p>
              {projects.length ? (
                <div className="activity-chart" role="img"
                  aria-label={`Monthly recorded work: ${insights.chartMonths.map((month) =>
                    `${month.label}: ${month.projects} projects added, ${month.profile} profile updates, ${month.versions} versions saved, ${month.uploads} files uploaded`).join('; ')}`}>
                  <div className="activity-chart-y-labels" aria-hidden="true">
                    <span>{insights.maxActivity}</span>
                    <span>{Math.ceil(insights.maxActivity / 2)}</span>
                    <span>0</span>
                  </div>
                  <div className="activity-chart-plot">
                    <div className="activity-chart-guides" aria-hidden="true"><i /><i /><i /></div>
                    <div className="activity-chart-bars">
                      {insights.chartMonths.map((month) => (
                        <div className="activity-chart-column" key={month.key}>
                          <div className="activity-chart-groups">
                            {[
                              ['projects', 'activity-project-bar'],
                              ['profile', 'activity-profile-bar'],
                              ['versions', 'activity-version-bar'],
                              ['uploads', 'activity-upload-bar'],
                            ].map(([key, className]) => (
                              <div className="activity-chart-series" key={key}>
                                <span className="activity-chart-value">{month[key] || ''}</span>
                                <div className="activity-chart-bar-wrap">
                                  <span className={`activity-chart-bar ${className}`}
                                    style={{ height: `${month[key] ? Math.max(8, (month[key] / insights.maxActivity) * 100) : 2}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                          <span className="activity-chart-month">{month.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="activity-empty-chart">
                  <span aria-hidden="true">▥</span>
                  <p>Your update chart will appear when you add a project.</p>
                  <Link to="/projects/new" className="btn btn-sm">Create a project</Link>
                </div>
              )}
              <div className="activity-ratio-legend" aria-label="Activity totals and proportions for the last six months">
                {[
                  { key: 'projects', label: 'Projects added', className: 'activity-project-dot' },
                  { key: 'profile', label: 'Profile updates', className: 'activity-profile-dot' },
                  { key: 'versions', label: 'Versions saved', className: 'activity-version-dot' },
                  { key: 'uploads', label: 'Files uploaded', className: 'activity-upload-dot' },
                ].map((series) => (
                  <div className="activity-ratio-item" key={series.key}>
                    <span><i className={series.className} />{series.label}</span>
                    <strong>{insights.totals[series.key]}</strong>
                    <small>{insights.activityTotal
                      ? `${Math.round((insights.totals[series.key] / insights.activityTotal) * 100)}% of activity`
                      : 'No activity yet'}</small>
                  </div>
                ))}
              </div>
            </section>

            <section className="activity-panel activity-sharing-panel">
              <div className="activity-panel-heading">
                <div>
                  <p className="workspace-eyebrow">VISIBILITY</p>
                  <h2>Sharing balance</h2>
                </div>
                <span className="activity-sharing-glyph" aria-hidden="true">◉</span>
              </div>
              <p className="activity-panel-subtitle">Choose what you share with the community.</p>
              <div className="activity-sharing-bar" role="img"
                aria-label={`${insights.publicCount} public and ${insights.privateCount} private projects`}>
                <span style={{ width: `${insights.sharedPercent}%` }} />
              </div>
              <div className="activity-sharing-legend">
                <span><i className="activity-public-dot" /> Public <strong>{insights.publicCount}</strong></span>
                <span><i className="activity-private-dot" /> Private <strong>{insights.privateCount}</strong></span>
              </div>
              <Link to="/projects" className="activity-text-link">Manage project visibility <span aria-hidden="true">→</span></Link>
            </section>
          </div>

          <section className="activity-panel activity-recent-panel">
            <div className="activity-panel-heading">
              <div>
                <p className="workspace-eyebrow">KEEP YOUR WORK HEALTHY</p>
                <h2>Your 3 latest projects</h2>
                <p className="activity-panel-subtitle">Project age, time since the last update, and a suggested next step.</p>
              </div>
              <Link className="activity-text-link" to="/projects">View all projects <span aria-hidden="true">→</span></Link>
            </div>
            {recentProjects.length ? (
              <div className="activity-recent-list">
                {recentProjects.map((project, index) => (
                  <article className="activity-maintenance-item" key={project.id}>
                    <div className="activity-maintenance-top">
                      <span className="activity-maintenance-number">{String(index + 1).padStart(2, '0')}</span>
                      <Link className="activity-maintenance-title" to={`/projects/${project.id}`}>
                        {project.title}
                      </Link>
                      <span className={`badge ${project.visibility === 'PUBLIC' ? 'public' : project.visibility === 'DEPARTMENT' ? 'department' : ''}`}>
                        {project.visibility === 'PUBLIC' ? 'Public – All Departments' : project.visibility === 'DEPARTMENT' ? 'Department Only' : 'Private – Only Me'}
                      </span>
                    </div>
                    <div className="activity-maintenance-meta">
                      <span>In your vault for <strong>{elapsedTime(project.createdAt)}</strong></span>
                      <span>Last updated <strong>{elapsedTime(project.updatedAt || project.createdAt)} ago</strong></span>
                      <span>{project.versionCount || 0} versions · {project.fileCount || 0} files</span>
                    </div>
                    <p className="activity-maintenance-tip">
                      <span aria-hidden="true">✦</span>{getMaintenanceTip(project)}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="activity-empty-recent">
                <p>No project activity yet. Start by adding your first project.</p>
                <Link className="btn btn-primary" to="/projects/new">Add your first project</Link>
              </div>
            )}
          </section>
          <ProjectActivityFeed />
        </>
      )}
    </section>
  );
}
