import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { isAdmin, user } = useAuth();
  const isSuperAdmin = isAdmin && !user?.department;
  return (
    <nav className={`sidebar ${isAdmin ? 'sidebar-admin' : ''}`} aria-label="Main">
      <div className="sidebar-group">
        <span className="sidebar-group-label">{isAdmin ? 'OVERVIEW' : 'MY WORKSPACE'}</span>
        {isAdmin ? (
          <>
            <NavLink to="/admin" end><span className="sidebar-icon" aria-hidden="true">▦</span>Overview</NavLink>
            {isSuperAdmin ? (
              <>
                <NavLink to="/admin/staff"><span className="sidebar-icon" aria-hidden="true">♟</span>Staff</NavLink>
                <NavLink to="/students"><span className="sidebar-icon" aria-hidden="true">⌕</span>Student portfolios</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/admin/students"><span className="sidebar-icon" aria-hidden="true">♙</span>Students</NavLink>
                <NavLink to="/admin/reviews"><span className="sidebar-icon" aria-hidden="true">★</span>Project reviews</NavLink>
                <NavLink to="/admin/activity"><span className="sidebar-icon" aria-hidden="true">▥</span>Activity analytics</NavLink>
              </>
            )}
          </>
        ) : (
          <>
            <NavLink to="/dashboard"><span className="sidebar-icon" aria-hidden="true">⌂</span>Dashboard</NavLink>
            <NavLink to="/projects" end><span className="sidebar-icon" aria-hidden="true">▧</span>Projects</NavLink>
            <NavLink to="/projects/new"><span className="sidebar-icon" aria-hidden="true">＋</span>Add project</NavLink>
            <NavLink to="/activity"><span className="sidebar-icon" aria-hidden="true">↗</span>Activity &amp; insights</NavLink>
          </>
        )}
      </div>
      {isSuperAdmin && (
        <div className="sidebar-group">
          <span className="sidebar-group-label">INSTITUTE</span>
          <NavLink to="/admin#admin-access"><span className="sidebar-icon" aria-hidden="true">⚿</span>Department admins</NavLink>
        </div>
      )}
      {!isAdmin && (
        <div className="sidebar-group">
          <span className="sidebar-group-label">DISCOVER</span>
          <NavLink to="/students" end><span className="sidebar-icon" aria-hidden="true">⌕</span>Find students</NavLink>
        </div>
      )}
      <div className="sidebar-group">
        <span className="sidebar-group-label">ACCOUNT</span>
        <NavLink to="/profile"><span className="sidebar-icon" aria-hidden="true">◉</span>Profile</NavLink>
        {!isAdmin && (
          <NavLink to="/settings"><span className="sidebar-icon" aria-hidden="true">⚙</span>Settings</NavLink>
        )}
      </div>
      <div className="sidebar-note">
        <span className="sidebar-note-mark" aria-hidden="true">✓</span>
        <span><strong>{isAdmin ? user?.name : 'Your work, organized'}</strong>
          <small>{isAdmin ? `${isSuperAdmin ? 'Institute admin' : 'Department admin'}${user?.department ? ` · ${user.department}` : ''}` : 'Projects · files · versions'}</small></span>
      </div>
    </nav>
  );
}
