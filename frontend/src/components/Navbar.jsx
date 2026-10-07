import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const nav = useNavigate();

  return (
    <header className="navbar">
      <Link to="/dashboard" className="brand" aria-label="ProjectVault home">
        <img src="/projectvault-mark.svg" alt="" />
        <span className="brand-copy">
          Project<span>Vault</span>
          <small>ACADEMIC WORKSPACE</small>
        </span>
      </Link>
      <div className="nav-user">
        <span className="nav-user-avatar" aria-hidden="true">{(user.name || '?').trim().charAt(0).toUpperCase()}</span>
        <span className="nav-user-copy">
          <strong>{user.name}</strong>
          <small>{isAdmin ? (user.department ? `${user.department} admin` : 'Institute admin') : user.department || 'Student account'}</small>
        </span>
        <button className="btn btn-sm nav-signout" onClick={() => { logout(); nav('/login'); }}>Sign out</button>
      </div>
    </header>
  );
}
