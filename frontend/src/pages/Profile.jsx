import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { errMsg, formatDate } from '../services/api';
import ProjectStars from '../components/ProjectStars';
import ActivityHeatmap from '../components/ActivityHeatmap';

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
}

async function copyLink(url) {
  if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable in this browser.');
  await navigator.clipboard.writeText(url);
}

export default function Profile() {
  const { user, isAdmin } = useAuth();
  const isSuperAdmin = isAdmin && !user?.department;
  const [profile, setProfile] = useState(null);
  const [adminOverview, setAdminOverview] = useState(null);
  const [adminOverviewLoading, setAdminOverviewLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoReload, setPhotoReload] = useState(0);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!isAdmin);
  const [sharingProject, setSharingProject] = useState(null);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    if (isAdmin) return;
    api.get('/auth/profile')
      .then(({ data }) => {
        setProfile(data);
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    let active = true;
    setAdminOverviewLoading(true);
    Promise.all(isSuperAdmin
      ? [api.get('/auth/users'), Promise.resolve({ data: [] })]
      : [api.get('/auth/users'), api.get('/projects/all')])
      .then(([usersResponse, projectsResponse]) => {
        if (active) setAdminOverview({ users: usersResponse.data, projects: projectsResponse.data });
      })
      .catch((err) => {
        if (active) setError(errMsg(err));
      })
      .finally(() => {
        if (active) setAdminOverviewLoading(false);
      });
    return () => { active = false; };
  }, [isAdmin, isSuperAdmin]);

  useEffect(() => {
    let active = true;
    let objectUrl;
    if (!profile?.hasProfileImage) {
      setPhotoUrl('');
      return undefined;
    }

    api.get(`/auth/students/${profile.id}/photo?refresh=${photoReload}`, { responseType: 'blob' })
      .then(({ data }) => {
        objectUrl = URL.createObjectURL(data);
        if (active) setPhotoUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch((err) => {
        if (active) setError(errMsg(err));
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profile?.id, profile?.hasProfileImage, photoReload]);

  const projects = profile?.projects || [];
  const stats = useMemo(() => ({
    projects: projects.length,
    files: projects.reduce((total, project) => total + project.fileCount, 0),
    versions: projects.reduce((total, project) => total + project.versionCount, 0),
    shared: projects.filter((project) => project.visibility === 'PUBLIC').length,
    ratedPublicProjects: profile?.ratedPublicProjectCount || 0,
    averageRating: profile?.averageProjectRating ?? null,
  }), [projects, profile]);

  const skills = (profile?.skills || '').split(',').map((skill) => skill.trim()).filter(Boolean);
  const adminProjects = adminOverview?.projects || [];
  const adminUsers = adminOverview?.users || [];
  const adminStats = {
    admins: adminUsers.filter((account) => account.role === 'ADMIN').length,
    students: adminUsers.filter((account) => account.role === 'STUDENT').length,
    projects: adminProjects.length,
    shared: adminProjects.filter((project) => project.visibility === 'PUBLIC').length,
    files: adminProjects.reduce((total, project) => total + project.fileCount, 0),
  };

  async function uploadProfilePhoto(e) {
    const photo = e.target.files?.[0];
    e.target.value = '';
    if (!photo) return;
    if (photo.size > 5 * 1024 * 1024) {
      setError('Choose a profile photo smaller than 5 MB.');
      return;
    }
    setPhotoSaving(true);
    setError('');
    try {
      const data = new FormData();
      data.append('photo', photo);
      const { data: updatedProfile } = await api.post('/auth/profile/photo', data);
      setProfile(updatedProfile);
      setPhotoReload((value) => value + 1);
      setShareMessage('Profile photo updated.');
    } catch (err) {
      setError(err.response?.status === 404
        ? 'The backend is running an older version without profile-photo upload. Stop it, rebuild the backend with `mvn clean spring-boot:run`, and try again.'
        : errMsg(err));
    } finally {
      setPhotoSaving(false);
    }
  }

  async function shareProfile() {
    setShareMessage('');
    try {
      await copyLink(`${window.location.origin}/students/${user.id}`);
      setShareMessage('Profile link copied. Signed-in ProjectVault users can view your public profile.');
    } catch (err) {
      setError(errMsg(err));
    }
  }

  async function copyProjectLink(project) {
    setError('');
    setShareMessage('');
    try {
      await copyLink(`${window.location.origin}/projects/${project.id}`);
      setShareMessage('Project link copied. Only signed-in users can open public projects.');
    } catch (err) {
      setError(errMsg(err));
    }
  }

  async function toggleProjectVisibility(project) {
    const nextVisibility = project.visibility === 'PRIVATE' ? 'DEPARTMENT' : project.visibility === 'DEPARTMENT' ? 'PUBLIC' : 'PRIVATE';
    setSharingProject(project.id);
    setError('');
    setShareMessage('');
    try {
      const { data } = await api.put(`/projects/${project.id}`, {
        title: project.title,
        description: project.description,
        techStack: project.techStack,
        category: project.category,
        visibility: nextVisibility,
      });
      setProfile((current) => ({
        ...current,
        projects: current.projects.map((item) => item.id === data.id ? data : item),
      }));
      if (nextVisibility === 'PUBLIC') {
        await copyLink(`${window.location.origin}/projects/${project.id}`);
        setShareMessage('Project is now public across departments. Its link has been copied.');
      } else if (nextVisibility === 'DEPARTMENT') {
        setShareMessage('Project is now visible to your department.');
      } else {
        setShareMessage('Project is now private.');
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSharingProject(null);
    }
  }

  return (
    <section className="profile-page">
      <div className={`profile-cover ${isAdmin ? 'admin-profile-cover' : ''}`}>
        <span className="profile-cover-label">
          {isAdmin ? 'PROJECTVAULT · ADMINISTRATOR' : 'PROJECTVAULT · PORTFOLIO'}
        </span>
      </div>

      <div className="card profile-intro">
        <div className="profile-avatar-wrap">
          <div className={`profile-avatar ${photoUrl ? 'has-photo' : ''}`} aria-label={`${user.name} profile photo`}>
            {photoUrl ? <img src={photoUrl} alt={`${user.name} profile`} /> : initials(user.name)}
          </div>
          {!isAdmin && (
            <>
              <input className="profile-photo-input" id="profile-photo-upload" type="file"
                accept="image/jpeg,image/png,image/gif" onChange={uploadProfilePhoto} disabled={photoSaving} />
              <label className="profile-photo-trigger" htmlFor="profile-photo-upload"
                aria-disabled={photoSaving}>
                <span aria-hidden="true">▣</span> {photoSaving ? 'Uploading…' : photoUrl ? 'Change photo' : 'Add photo'}
              </label>
            </>
          )}
        </div>
        <div className="profile-intro-main">
          <div className="profile-title-row">
            <div>
              <h1>{user.name}</h1>
              <p className="profile-headline">
                {isAdmin ? 'ProjectVault administrator' : profile?.course || 'Student · Building and sharing projects'}
              </p>
            </div>
            {!isAdmin && (
              <div className="profile-actions">
                <button className="btn" onClick={shareProfile} disabled={profile?.profileVisibility !== 'PUBLIC'}
                  title={profile?.profileVisibility !== 'PUBLIC' ? 'Set your profile to public before sharing it' : ''}>
                  Share profile
                </button>
                <Link className="btn btn-primary" to="/settings">Edit settings</Link>
              </div>
            )}
          </div>
          <div className="profile-contact">
            <span>{user.email}</span>
            {profile?.department && <span>{profile.department}</span>}
            {!isAdmin && profile && <span className={`badge ${profile.profileVisibility === 'PUBLIC' ? 'public' : ''}`}>
              Profile {profile.profileVisibility === 'PUBLIC' ? 'Public' : 'Private'}
            </span>}
            <span className={`badge ${isAdmin ? 'admin' : 'public'}`}>{isAdmin ? 'Admin' : 'Student'}</span>
          </div>
        </div>
      </div>

      {shareMessage && <div className="profile-share-message" role="status">{shareMessage}</div>}
      {error && <div className="error" role="alert">{error}</div>}

      {isAdmin ? (
        <div className="admin-profile-content">
          <section className="admin-profile-welcome-card">
            <div className="admin-profile-welcome-copy">
              <p className="profile-eyebrow">ADMIN CONTROL CENTER</p>
              <h2>Administrator profile</h2>
              <p>
                {isSuperAdmin
                  ? `Welcome back, ${user.name.split(/\s+/)[0]}. Manage department administrators and explore student portfolios shared publicly.`
                  : `Welcome back, ${user.name.split(/\s+/)[0]}. Keep track of student work, shared projects, and the files in your workspace.`}
              </p>
              <div className="admin-profile-actions">
                <Link to="/admin" className="btn btn-primary">Open admin dashboard <span aria-hidden="true">→</span></Link>
                <span className="admin-profile-secure"><span aria-hidden="true">✓</span> Administrator access active</span>
              </div>
            </div>
            <div className="admin-profile-emblem" aria-hidden="true">
              <span>PV</span>
              <small>ADMIN</small>
            </div>
          </section>

          <section className="admin-profile-stats" aria-label="Platform overview">
            {(isSuperAdmin
              ? [{ label: 'Administrator accounts', value: adminStats.admins, icon: '♟' }]
              : [
                { label: 'Students', value: adminStats.students, icon: '♙' },
                { label: 'Projects', value: adminStats.projects, icon: '▧' },
                { label: 'Shared projects', value: adminStats.shared, icon: '↗' },
                { label: 'Files stored', value: adminStats.files, icon: '▤' },
              ]).map((stat) => (
              <article className="admin-profile-stat" key={stat.label}>
                <span className="admin-profile-stat-icon" aria-hidden="true">{stat.icon}</span>
                <span className="admin-profile-stat-copy">
                  <strong>{adminOverviewLoading ? '—' : stat.value}</strong>
                  <span>{stat.label}</span>
                </span>
              </article>
            ))}
          </section>

          {isSuperAdmin ? (
            <div className="admin-profile-lower">
              <section className="admin-profile-panel">
                <p className="profile-eyebrow">STUDENT WORK</p>
                <h3>Explore public portfolios</h3>
                <p>Browse student profiles and work they have chosen to share. Project reviews and ratings are managed by department administrators.</p>
                <Link to="/students" className="btn btn-primary">Browse student portfolios</Link>
              </section>
              <aside className="admin-profile-panel admin-profile-tip">
                <p className="profile-eyebrow">ADMIN ACCESS</p>
                <h3>Manage department administrators</h3>
                <p>Create a department administrator account or assign an existing account to a department.</p>
                <Link to="/admin#admin-access" className="admin-profile-tip-link">Manage administrators <span aria-hidden="true">→</span></Link>
              </aside>
            </div>
          ) : (
          <div className="admin-profile-lower">
            <section className="admin-profile-panel">
              <div className="admin-profile-section-heading">
                <div>
                  <p className="profile-eyebrow">LATEST UPDATES</p>
                  <h3>Recently updated projects</h3>
                </div>
                <Link to="/admin" className="profile-text-link">View all <span aria-hidden="true">→</span></Link>
              </div>
              {adminOverviewLoading ? (
                <p className="muted">Loading project activity…</p>
              ) : adminProjects.length === 0 ? (
                <p className="muted">Projects will appear here as students add their work.</p>
              ) : (
                <div className="admin-recent-projects">
                  {[...adminProjects]
                    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                    .slice(0, 3)
                    .map((project) => (
                      <Link className="admin-recent-project" to={`/projects/${project.id}`} key={project.id}>
                        <span className="admin-recent-mark" aria-hidden="true">
                          {(project.title || 'P').trim().charAt(0).toUpperCase()}
                        </span>
                        <span className="admin-recent-copy">
                          <strong>{project.title}</strong>
                          <span>{project.ownerName} · Updated {formatDate(project.updatedAt)}</span>
                        </span>
                        <span className={`badge ${project.visibility === 'PUBLIC' ? 'public' : project.visibility === 'DEPARTMENT' ? 'department' : ''}`}>
                          {project.visibility === 'PUBLIC' ? 'Public – All Departments' : project.visibility === 'DEPARTMENT' ? 'Department Only' : 'Private – Only Me'}
                        </span>
                      </Link>
                    ))}
                </div>
              )}
            </section>

            <aside className="admin-profile-panel admin-profile-tip">
              <span className="admin-profile-tip-icon" aria-hidden="true">✦</span>
              <p className="profile-eyebrow">YOUR WORKSPACE</p>
              <h3>Support great work</h3>
              <p>Review submissions, explore shared projects, and leave feedback that helps students keep improving.</p>
              <Link to="/admin" className="admin-profile-tip-link">Manage the workspace <span aria-hidden="true">→</span></Link>
            </aside>
          </div>
          )}
        </div>
      ) : (
        <div className="profile-content">
          <div className="profile-main-column">
            <section className="card profile-section">
              <div className="profile-section-heading">
                <div>
                  <p className="profile-eyebrow">YOUR STORY</p>
                  <h2>About</h2>
                </div>
              </div>
              {loading ? <p className="muted">Loading your profile…</p> : (
                <p className="profile-summary">
                  {profile?.summary || 'Add a short introduction to tell people about your interests and the work you do.'}
                </p>
              )}
            </section>

            <section className="card profile-section">
              <div className="profile-section-heading">
                <div>
                  <p className="profile-eyebrow">YOUR WORK</p>
                  <h2>Project portfolio</h2>
                </div>
                <Link to="/projects" className="profile-text-link">View all</Link>
              </div>
              {loading ? <p className="muted">Loading your projects…</p> : projects.length === 0 ? (
                <div className="profile-empty">
                  <div className="profile-empty-icon" aria-hidden="true">+</div>
                  <h3>Your portfolio starts here</h3>
                  <p className="muted">Add your first project to showcase what you’re building.</p>
                  <Link to="/projects/new" className="btn btn-primary">Create a project</Link>
                </div>
              ) : (
                <div className="profile-project-list">
                  {projects.slice(0, 6).map((project) => (
                    <article className="profile-project" key={project.id}>
                      <div className="profile-project-mark" aria-hidden="true">
                        {(project.title || 'P').trim().charAt(0).toUpperCase()}
                      </div>
                      <div className="profile-project-body">
                        <div className="profile-project-heading">
                          <h3><Link to={`/projects/${project.id}`}>{project.title}</Link></h3>
                          <span className={`badge ${project.visibility === 'PUBLIC' ? 'public' : project.visibility === 'DEPARTMENT' ? 'department' : ''}`}>
                            {project.visibility === 'PUBLIC' ? 'Public – All Departments' : project.visibility === 'DEPARTMENT' ? 'Department Only' : 'Private – Only Me'}
                          </span>
                        </div>
                        <p className="profile-project-description">
                          {project.description || 'A project in progress. Add a description to tell people more about it.'}
                        </p>
                        <div className="meta">
                          {project.category && <span>{project.category}</span>}
                          {project.techStack && <span>{project.techStack}</span>}
                          <span>{project.versionCount} {project.versionCount === 1 ? 'version' : 'versions'}</span>
                          <span>Updated {formatDate(project.updatedAt)}</span>
                          {project.visibility === 'PUBLIC' && project.starRating != null
                            && <ProjectStars value={project.starRating} />}
                        </div>
                        <div className="profile-project-actions">
                          {project.visibility === 'PUBLIC' && (
                            <button className="btn btn-sm" onClick={() => copyProjectLink(project)}>Copy project link</button>
                          )}
                          <button className="btn btn-sm profile-project-share" disabled={sharingProject === project.id}
                            onClick={() => toggleProjectVisibility(project)}>
                            {sharingProject === project.id ? 'Updating…' : project.visibility === 'PRIVATE' ? 'Set Department Only' : project.visibility === 'DEPARTMENT' ? 'Set Public' : 'Make private'}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="profile-side-column">
            <section className="card profile-section">
              <p className="profile-eyebrow">AT A GLANCE</p>
              <h2>Portfolio activity</h2>
              <div className="profile-stats">
                <div><strong>{stats.projects}</strong><span>Projects</span></div>
                <div><strong>{stats.versions}</strong><span>Versions</span></div>
                <div><strong>{stats.files}</strong><span>Files</span></div>
                <div><strong>{stats.shared}</strong><span>Shared</span></div>
                <div><strong>{stats.averageRating == null ? '—' : `${stats.averageRating.toFixed(1)}/5`}</strong><span>Average rating</span></div>
                <div><strong>{stats.ratedPublicProjects}</strong><span>Rated public projects</span></div>
                <div><strong>{profile?.totalProjectStars || 0}</strong><span>Total public project stars</span></div>
              </div>
            </section>

            <section className="card profile-section">
              <p className="profile-eyebrow">EDUCATION</p>
              <h2>Department &amp; course</h2>
              <p className="profile-education">{profile?.course || 'Add your course'}</p>
              <p className="muted profile-side-copy">{profile?.department || 'Add your department'}</p>
            </section>

            <section className="card profile-section">
              <p className="profile-eyebrow">TOOLKIT</p>
              <h2>Skills</h2>
              {skills.length ? (
                <div className="profile-skills">
                  {skills.map((skill) => <span className="badge" key={skill}>{skill}</span>)}
                </div>
              ) : (
                <p className="muted profile-side-copy">Add your skills to your profile.</p>
              )}
            </section>
          </aside>
        </div>
      )}
      {!isAdmin && <ActivityHeatmap title="Activity & consistency" eyebrow="YOUR PORTFOLIO · LAST 12 MONTHS" />}
    </section>
  );
}
