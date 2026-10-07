import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { errMsg, formatDate } from '../services/api';
import AdminUserAvatar from '../components/AdminUserAvatar';

const PAGE_SIZE = 15;

export default function AdminStudents({ accountRole = 'STUDENT' }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'ADMIN' && !user?.department;
  const isStaffDirectory = accountRole === 'ADMIN';
  const [accounts, setAccounts] = useState([]);
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reportAvatarError = useCallback((message) => setError(message), []);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/auth/users');
      setAccounts(data.filter((account) => account.role === accountRole));
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, [accountRole]);

  useEffect(() => {
    setPage(0);
    loadAccounts();
  }, [loadAccounts]);

  const departments = useMemo(() => [...new Set(accounts.map((account) => account.department).filter(Boolean))].sort(), [accounts]);
  const filtered = accounts.filter((account) =>
    (!department || account.department === department)
    && `${account.name} ${account.email}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  if (isSuperAdmin && !isStaffDirectory) return <Navigate to="/admin/staff" replace />;

  async function deleteStudent(student) {
    const accountType = isStaffDirectory ? 'staff account' : 'student account';
    if (!window.confirm(`Delete ${student.name}'s ${accountType} and all of their projects? This cannot be undone.`)) return;
    try {
      await api.delete(`/auth/users/${student.id}`);
      await loadAccounts();
    } catch (err) {
      setError(errMsg(err));
    }
  }

  return (
    <section className="admin-dashboard admin-management-page">
      <header className="admin-dashboard-hero">
        <div className="admin-dashboard-copy">
          <p className="workspace-eyebrow">{isStaffDirectory ? 'STAFF MANAGEMENT' : 'STUDENT MANAGEMENT'}</p>
          <h1>{isStaffDirectory ? 'Staff' : 'Students'}</h1>
          <p>{isSuperAdmin
            ? `Search and filter ${isStaffDirectory ? 'staff' : 'student'} accounts across the institute.`
            : `${isStaffDirectory ? 'Staff' : 'Students'} assigned to ${user?.department || 'your department'}.`}</p>
          <div className="admin-scope-badges"><span>{isSuperAdmin ? 'Institute-wide access' : user?.department}</span></div>
        </div>
        <div className="admin-dashboard-mark" aria-hidden="true">{isStaffDirectory ? 'T' : 'S'}</div>
      </header>
      {error && <div className="error" role="alert">{error}</div>}
      <section className="card admin-list-card">
        <div className="admin-list-toolbar">
          <div>
            <p className="workspace-eyebrow">AUTHORIZED ACCOUNTS</p>
            <h2>{loading ? `Loading ${isStaffDirectory ? 'staff' : 'students'}…`
              : error ? `${isStaffDirectory ? 'Staff' : 'Student'} list unavailable`
                : `${filtered.length} ${isStaffDirectory ? 'staff' : filtered.length === 1 ? 'student' : 'students'}`}</h2>
          </div>
          <div className="admin-list-actions">
            <label className="admin-search">
              <span aria-hidden="true">⌕</span>
              <input type="search" aria-label={`Search ${isStaffDirectory ? 'staff' : 'students'} by name or email`} placeholder="Search name or email"
                value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} />
            </label>
            {isSuperAdmin && (
              <select aria-label={`Filter ${isStaffDirectory ? 'staff' : 'students'} by department`} value={department}
                onChange={(event) => { setDepartment(event.target.value); setPage(0); }}>
                <option value="">All departments</option>
                {departments.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            )}
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>{isStaffDirectory ? 'Staff member' : 'Student'}</th><th>Email</th><th>Department</th>
              {isStaffDirectory
                ? <><th>Access</th><th>Joined</th>{isSuperAdmin && <th>Action</th>}</>
                : <><th>Course</th><th>Projects</th><th>Rated public</th><th>Average rating</th><th>Joined</th><th>Action</th></>}
            </tr></thead>
            <tbody>
              {loading && <tr><td colSpan={isStaffDirectory ? (isSuperAdmin ? '6' : '5') : '9'} className="muted">
                Loading authorized {isStaffDirectory ? 'staff' : 'student'} accounts…
              </td></tr>}
              {!loading && pageRows.map((account) => (
                <tr key={account.id}>
                  <td><span className="admin-user-name"><AdminUserAvatar user={account} onError={reportAvatarError} /><strong>{account.name}</strong></span></td>
                  <td>{account.email}</td>
                  <td>{account.department || '—'}</td>
                  {isStaffDirectory ? (
                    <>
                      <td><span className="badge admin">
                        {account.department ? 'Department administrator' : 'Institute administrator'}
                      </span></td>
                      <td>{formatDate(account.createdAt)}</td>
                      {isSuperAdmin && (
                        <td>{account.department
                          ? <button type="button" className="btn btn-sm btn-danger" onClick={() => deleteStudent(account)}>Remove staff</button>
                          : <span className="muted">Protected</span>}</td>
                      )}
                    </>
                  ) : (
                    <>
                      <td>{account.course || '—'}</td>
                      <td>{account.projectCount}</td>
                      <td>{Number.isFinite(account.ratedPublicProjectCount) ? account.ratedPublicProjectCount : '—'}</td>
                      <td>{account.averageProjectRating == null ? '—' : `${account.averageProjectRating.toFixed(1)} / 5`}</td>
                      <td>{formatDate(account.createdAt)}</td>
                      <td><button type="button" className="btn btn-sm btn-danger" onClick={() => deleteStudent(account)}>Delete</button></td>
                    </>
                  )}
                </tr>
              ))}
              {!loading && !error && !pageRows.length && <tr><td colSpan={isStaffDirectory ? (isSuperAdmin ? '6' : '5') : '9'} className="muted">
                {query || department
                  ? `No ${isStaffDirectory ? 'staff' : 'students'} match these filters.`
                  : `No ${isStaffDirectory ? 'staff' : 'students'} are in your administration scope.`}
              </td></tr>}
            </tbody>
          </table>
        </div>
        <footer className="admin-pagination">
          <span className="muted">Showing {filtered.length ? page * PAGE_SIZE + 1 : 0}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div>
            <button type="button" className="btn btn-sm" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>Previous</button>
            <span>Page {pageCount ? page + 1 : 0} of {pageCount}</span>
            <button type="button" className="btn btn-sm" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => current + 1)}>Next</button>
          </div>
        </footer>
      </section>
      <p className="muted admin-policy-note">{isStaffDirectory
        ? 'Staff listing is scoped by the server to your authorized administration scope. Institute administrators can remove department staff accounts, including their projects.'
        : 'Student listing is scoped by the server to your authorized administration scope. Deleting an account also removes its projects.'}</p>
      <Link to="/admin" className="btn">← Back to overview</Link>
    </section>
  );
}
