import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function FloatingProjectAction() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isProjectForm = pathname === '/projects/new' || /^\/projects\/\d+\/edit$/.test(pathname);

  if (user?.role !== 'STUDENT' || isProjectForm) return null;

  return (
    <Link className="floating-project-action" to="/projects/new">
      <span aria-hidden="true">＋</span>
      <span>Create project</span>
    </Link>
  );
}
