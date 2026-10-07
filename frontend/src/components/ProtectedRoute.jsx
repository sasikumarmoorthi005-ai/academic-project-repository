import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ roles }) {
  const { user, authReady, authError, retryAuth } = useAuth();
  const location = useLocation();

  if (!authReady) return <p className="muted">Checking sign-in…</p>;
  if (authError) {
    return (
      <div className="error" role="alert">
        {authError}{' '}
        <button className="btn btn-sm" onClick={retryAuth}>Retry</button>
      </div>
    );
  }
  if (!user) {
    const from = { pathname: location.pathname, search: location.search, hash: location.hash };
    return <Navigate to="/login" state={{ from }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />;
  }
  return <Outlet />;
}
