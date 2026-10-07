import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { downloadFile, errMsg, formatDate, formatSize } from '../services/api';
import Illustration from '../components/Illustration';
import ProjectStars from '../components/ProjectStars';
import ProjectActivityFeed from '../components/ProjectActivityFeed';
import { useAuth } from '../context/AuthContext';
import AdminUserAvatar from '../components/AdminUserAvatar';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedView, setSelectedView] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [storedFiles, setStoredFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminForm, setAdminForm] = useState({
    name: '', email: '', department: 'Computer Science', password: '',
  });
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const selectedViewRef = useRef(null);
  const isSuperAdmin = user?.role === 'ADMIN' && !user?.department;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
    const [usersResponse, projectsResponse] = await Promise.all(isSuperAdmin
      ? [api.get('/auth/users'), Promise.resolve({ data: [] })]
      : [api.get('/auth/users'), api.get('/projects/all')]);
    setUsers(usersResponse.data);
    setProjects(projectsResponse.data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  async function removeUser(u) {
    if (!window.confirm(`Delete ${u.name} and all of their projects?`)) return;
    try {
      await api.delete(`/auth/users/${u.id}`);
      await load();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  async function provisionAdmin(event) {
    event.preventDefault();
    setAdminSaving(true);
    setError('');
    setAdminMessage('');
    try {
      const { data } = await api.post('/auth/admins', {
        ...adminForm,
        name: adminForm.name.trim() || null,
        password: adminForm.password || null,
      });
      setAdminForm({ name: '', email: '', department: 'Computer Science', password: '' });
      setAdminMessage(`${data.email} is now an admin for ${data.department}. They must sign in again to access the admin dashboard.`);
      await load();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setAdminSaving(false);
    }
  }

  const students = users.filter((u) => u.role === 'STUDENT').length;
  const shared = projects.filter((p) => p.visibility === 'PUBLIC').length;
  const fileCount = projects.reduce((total, project) => total + project.fileCount, 0);
  const reportAvatarError = useCallback((message) => setError(message), []);
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const matchesQuery = (...values) => !normalizedQuery || values.some((value) =>
    String(value || '').toLocaleLowerCase().includes(normalizedQuery));

  async function selectView(view) {
    selectedViewRef.current = view;
    setSelectedView(view);
    setError('');
    if (view !== 'files') return;

    setFilesLoading(true);
    try {
      const details = await Promise.all(projects.map(async (project) => {
        const { data } = await api.get(`/projects/${project.id}`);
        return (data.files || []).map((file) => ({
          ...file,
          projectId: project.id,
          projectTitle: project.title,
          ownerName: project.ownerName,
        }));
      }));
      if (selectedViewRef.current === 'files') setStoredFiles(details.flat());
    } catch (err) {
      if (selectedViewRef.current === 'files') setError(errMsg(err));
    } finally {
      if (selectedViewRef.current === 'files') setFilesLoading(false);
    }
  }

  function clearSelection() {
    selectedViewRef.current = null;
    setSelectedView(null);
    setError('');
  }

  const summaryCards = [
    ...(isSuperAdmin
      ? [{ key: 'staff', label: 'Administrator accounts', count: users.length, illustration: 'shared' }]
      : [
        { key: 'students', label: 'Students', count: students, illustration: 'shared' },
        { key: 'projects', label: 'Projects', count: projects.length, illustration: 'project' },
        { key: 'shared', label: 'Shared projects', count: shared, illustration: 'shared' },
        { key: 'files', label: 'Files stored', count: fileCount, illustration: 'files' },
      ]),
  ];

  const visibleProjects = selectedView === 'shared'
    ? projects.filter((project) => project.visibility === 'PUBLIC')
    : projects;
  const filteredUsers = users.filter((account) => matchesQuery(
    account.name, account.email, account.department, account.role,
  ));
  const filteredProjects = visibleProjects.filter((project) => matchesQuery(
    project.title, project.ownerName, project.visibility, project.category,
  ));
  const filteredFiles = storedFiles.filter((file) => matchesQuery(
    file.fileName, file.category, file.projectTitle, file.ownerName,
  ));
  const scopeDescription = isSuperAdmin
    ? 'Manage department administrator accounts and explore student portfolios shared publicly.'
    : `Department workspace for ${user?.department || 'your department'}. Student management and activity are limited to this department.`;

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-hero">
        <div className="admin-dashboard-copy">
          <p className="workspace-eyebrow">{isSuperAdmin ? 'INSTITUTE ADMINISTRATION' : 'DEPARTMENT ADMINISTRATION'}</p>
          <h1>Admin workspace</h1>
          <p>{scopeDescription}</p>
          <div className="admin-scope-badges">
            <span>{isSuperAdmin ? 'Institute admin' : 'Department admin'}</span>
            {user?.department && <span>{user.department}</span>}
          </div>
        </div>
        <div className="admin-dashboard-mark" aria-hidden="true">A</div>
      </header>
      {error && <div className="error" role="alert">{error}</div>}
      {isSuperAdmin && (
        <form id="admin-access" className="card admin-provision-card" onSubmit={provisionAdmin}>
          <div className="admin-section-heading">
            <div>
              <p className="workspace-eyebrow">ADMIN ACCESS</p>
              <h2>Create or assign a department administrator</h2>
              <p className="muted">Promote an account by email, or provide a name and password to create a new administrator account.</p>
            </div>
            <span className="admin-provision-mark" aria-hidden="true">＋</span>
          </div>
          {adminMessage && <p className="success-message" role="status">{adminMessage}</p>}
          <div className="admin-provision-fields">
            <div className="field">
              <label htmlFor="department-admin-email">Account email</label>
              <input id="department-admin-email" type="email" autoComplete="email" required value={adminForm.email}
                placeholder="admin@college.edu"
                onChange={(event) => setAdminForm({ ...adminForm, email: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="department-admin-department">Department</label>
              <select id="department-admin-department" required value={adminForm.department}
                onChange={(event) => setAdminForm({ ...adminForm, department: event.target.value })}>
                {['Computer Science', 'Information Technology', 'Electronics and Communication',
                  'Mechanical Engineering', 'Civil Engineering'].map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="department-admin-name">Name <span className="muted">(new account only)</span></label>
              <input id="department-admin-name" autoComplete="name" value={adminForm.name}
                placeholder="Administrator name"
                onChange={(event) => setAdminForm({ ...adminForm, name: event.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="department-admin-password">Temporary password <span className="muted">(new account only)</span></label>
              <input id="department-admin-password" type="password" autoComplete="new-password"
                minLength={8} maxLength={72} placeholder="At least 8 characters"
                value={adminForm.password}
                onChange={(event) => setAdminForm({ ...adminForm, password: event.target.value })} />
            </div>
          </div>
          <div className="admin-provision-footer">
            <p>Promoted accounts keep their current password. Leave the password blank when promoting.</p>
            <button className="btn btn-primary" disabled={adminSaving}>
              {adminSaving ? 'Saving administrator…' : 'Create or assign admin'}
            </button>
          </div>
        </form>
      )}
      <div className="admin-section-heading admin-overview-heading">
        <div>
          <p className="workspace-eyebrow">AT A GLANCE</p>
          <h2>Workspace overview</h2>
        </div>
        <span className="admin-data-status">{loading ? 'Updating…' : 'Live workspace data'}</span>
      </div>
      <div className="stats">
        {summaryCards.map((card) => (
          <button type="button" className={`card stat stat-selectable ${selectedView === card.key ? 'stat-selected' : ''}`}
            key={card.key} aria-pressed={selectedView === card.key} onClick={() => selectView(card.key)}
            disabled={loading}>
            <Illustration type={card.illustration} className="stat-illustration" />
            <b>{loading ? '—' : card.count}</b>
            <span className="admin-stat-label">{card.label}</span>
            <span className="stat-open-hint">{selectedView === card.key ? 'Selected view' : 'Open details →'}</span>
          </button>
        ))}
      </div>
      {isSuperAdmin && (
        <section className="card admin-list-card">
          <p className="workspace-eyebrow">PUBLIC STUDENT WORK</p>
          <h2>Explore student portfolios</h2>
          <p className="muted">Browse portfolios students have chosen to share. Project review and rating are reserved for department administrators.</p>
          <Link to="/students" className="btn btn-primary">Browse student portfolios</Link>
        </section>
      )}
      <div className="admin-list-toolbar">
        <div>
          <p className="workspace-eyebrow">{selectedView ? 'MANAGE RECORDS' : 'RECENT RECORDS'}</p>
          <h2>{selectedView === 'staff' ? 'Staff accounts'
            : selectedView === 'projects' ? 'Projects you can access'
            : selectedView === 'shared' ? 'Public projects'
              : selectedView === 'files' ? 'Stored files'
                : selectedView === 'students' ? 'Students and accounts' : 'Accounts and projects'}</h2>
        </div>
        <div className="admin-list-actions">
          {selectedView && <button type="button" className="btn" onClick={clearSelection}>Overview</button>}
          <label className="admin-search">
            <span aria-hidden="true">⌕</span>
            <input type="search" aria-label="Search admin records" placeholder="Search records"
              value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
          </label>
        </div>
      </div>

      {(!selectedView || selectedView === 'students' || selectedView === 'staff') && (
        <div className="card admin-list-card">
          <h2>{isSuperAdmin ? 'Staff accounts' : selectedView === 'students' ? 'Students' : 'Users'}</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Course</th><th>Role</th><th>Projects</th><th>Rated public</th><th>Avg rating</th><th>Joined</th><th></th></tr></thead>
              <tbody>
                {filteredUsers.filter((account) => isSuperAdmin
                  ? account.role === 'ADMIN'
                  : selectedView !== 'students' || account.role === 'STUDENT').map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className="admin-user-name">
                        <AdminUserAvatar user={u} onError={reportAvatarError} />
                        <strong>{u.name}</strong>
                      </span>
                    </td><td>{u.email}</td>
                    <td>{u.department || '—'}</td>
                    <td>{u.course || '—'}</td>
                    <td><span className={`badge ${u.role === 'ADMIN' ? 'admin' : ''}`}>{u.role === 'ADMIN' ? 'Admin' : 'Student'}</span></td>
                    <td>{u.projectCount}</td><td>{Number.isFinite(u.ratedPublicProjectCount) ? u.ratedPublicProjectCount : '—'}</td>
                    <td>{u.averageProjectRating == null ? '—' : `${u.averageProjectRating.toFixed(1)} / 5`}</td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>{u.role !== 'ADMIN' && <button className="btn btn-sm btn-danger" onClick={() => removeUser(u)}>Delete</button>}</td>
                  </tr>
                ))}
                {!loading && !error && filteredUsers.filter((account) => isSuperAdmin
                  ? account.role === 'ADMIN'
                  : selectedView !== 'students' || account.role === 'STUDENT').length === 0 && (
                  <tr><td colSpan="10" className="muted">{searchQuery ? 'No accounts match this search.' : 'No accounts found in your administration scope.'}</td></tr>
                )}
                {loading && <tr><td colSpan="10" className="muted">Loading accounts…</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isSuperAdmin && (selectedView === 'projects' || selectedView === 'shared' || !selectedView) && (
        <div className="card admin-list-card">
          <h2>{selectedView === 'shared' ? 'Public projects' : 'Projects you can access'}</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Title</th><th>Owner</th><th>Visibility</th><th>Rating</th><th>Versions</th><th>Updated</th><th></th></tr></thead>
              <tbody>
                {filteredProjects.map((p) => (
                  <tr key={p.id}>
                    <td><Link to={`/projects/${p.id}`}>{p.title}</Link></td>
                    <td>{p.ownerName}</td>
                    <td><span className={`badge ${p.visibility === 'PUBLIC' ? 'public' : p.visibility === 'DEPARTMENT' ? 'department' : ''}`}>
                      {p.visibility === 'PUBLIC' ? 'Public' : p.visibility === 'DEPARTMENT' ? 'Department' : 'Private'}
                    </span></td>
                    <td><ProjectStars value={p.starRating} /></td>
                    <td>{p.versionCount}</td><td>{formatDate(p.updatedAt)}</td>
                    <td><Link className="btn btn-sm" to={`/projects/${p.id}`}>{p.visibility === 'PUBLIC' ? 'Review' : 'Open'}</Link></td>
                  </tr>
                ))}
                {!loading && !error && filteredProjects.length === 0 && <tr><td colSpan="7" className="muted">{searchQuery ? 'No projects match this search.' : 'No projects are available in your access scope yet.'}</td></tr>}
                {loading && <tr><td colSpan="7" className="muted">Loading projects…</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isSuperAdmin && selectedView === 'files' && (
        <div className="card admin-list-card">
          <h2>Stored files</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>File</th><th>Type</th><th>Project</th><th>Owner</th><th>Size</th><th>Uploaded</th><th></th></tr></thead>
              <tbody>
                {filesLoading && <tr><td colSpan="7" className="muted">Loading files…</td></tr>}
                {!filesLoading && filteredFiles.map((file) => (
                  <tr key={file.id}>
                    <td>{file.fileName}</td>
                    <td>{file.category === 'SOURCE_CODE' ? 'Source code'
                      : file.category === 'DOCUMENTATION' ? 'Documentation'
                        : file.category === 'PRESENTATION' ? 'Presentation' : 'Other'}</td>
                    <td><Link to={`/projects/${file.projectId}`}>{file.projectTitle}</Link></td>
                    <td>{file.ownerName}</td>
                    <td>{formatSize(file.size)}</td>
                    <td>{formatDate(file.uploadedAt)}</td>
                    <td><button className="btn btn-sm" onClick={() => downloadFile(file).catch((err) => setError(errMsg(err)))}>Download</button></td>
                  </tr>
                ))}
                {!filesLoading && filteredFiles.length === 0 && (
                  <tr><td colSpan="7" className="muted">{searchQuery ? 'No files match this search.' : 'No files have been uploaded to accessible projects.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!isSuperAdmin && !selectedView && <ProjectActivityFeed limit={8} />}
    </div>
  );
}
