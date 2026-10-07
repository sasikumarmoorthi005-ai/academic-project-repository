import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg, formatDate } from '../services/api';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/auth/departments/overview')
      .then(({ data }) => { if (active) setDepartments(data); })
      .catch((err) => { if (active) setError(errMsg(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const totals = useMemo(() => departments.reduce((result, department) => ({
    students: result.students + department.studentCount,
    admins: result.admins + department.adminCount,
    projects: result.projects + department.publicProjectCount,
  }), { students: 0, admins: 0, projects: 0 }), [departments]);

  return (
    <section className="admin-dashboard admin-management-page">
      <header className="admin-dashboard-hero">
        <div className="admin-dashboard-copy">
          <p className="workspace-eyebrow">INSTITUTE ADMINISTRATION</p>
          <h1>Departments</h1>
          <p>Review student, department-admin, and public-project totals for each configured department.</p>
          <div className="admin-scope-badges"><span>Configured departments only</span><span>Private projects excluded</span></div>
        </div>
        <div className="admin-dashboard-mark" aria-hidden="true">D</div>
      </header>
      {error && <div className="error" role="alert">{error}</div>}
      <div className="stats">
        <article className="card stat"><b>{loading || error ? '—' : departments.length}</b><span className="admin-stat-label">Configured departments</span></article>
        <article className="card stat"><b>{loading || error ? '—' : totals.students}</b><span className="admin-stat-label">Students</span></article>
        <article className="card stat"><b>{loading || error ? '—' : totals.admins}</b><span className="admin-stat-label">Department admins</span></article>
        <article className="card stat"><b>{loading || error ? '—' : totals.projects}</b><span className="admin-stat-label">Public projects</span></article>
      </div>
      <section className="card admin-list-card">
        <div className="admin-section-heading"><div><p className="workspace-eyebrow">DEPARTMENT DIRECTORY</p><h2>Configured departments</h2></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Department</th><th>Students</th><th>Admins</th><th>Public projects</th><th>Latest public activity</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="5" className="muted">Loading department summaries…</td></tr>}
              {!loading && departments.map((department) => (
                <tr key={department.name}>
                  <td><strong>{department.name}</strong></td>
                  <td>{department.studentCount}</td>
                  <td>{department.adminCount}</td>
                  <td>{department.publicProjectCount}</td>
                  <td>{department.latestPublicActivity ? formatDate(department.latestPublicActivity) : 'No recorded public activity'}</td>
                </tr>
              ))}
              {!loading && !error && !departments.length && <tr><td colSpan="5" className="muted">No departments are configured.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <p className="muted admin-policy-note">Departments are currently defined by the backend allow-list. This screen is read-only; project visibility remains enforced independently of institute-wide student management.</p>
      <Link to="/admin" className="btn">← Back to overview</Link>
    </section>
  );
}
