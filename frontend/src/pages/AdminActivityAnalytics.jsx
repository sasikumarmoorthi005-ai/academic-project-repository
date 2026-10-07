import { Link, Navigate } from 'react-router-dom';
import ActivityHeatmap from '../components/ActivityHeatmap';
import ProjectActivityFeed from '../components/ProjectActivityFeed';
import { useAuth } from '../context/AuthContext';

export default function AdminActivityAnalytics() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'ADMIN' && !user?.department;
  if (isSuperAdmin) return <Navigate to="/admin" replace />;

  return (
    <section className="admin-dashboard admin-management-page">
      <header className="admin-dashboard-hero">
        <div className="admin-dashboard-copy">
          <p className="workspace-eyebrow">RECORDED PROJECT EVENTS</p>
          <h1>Activity analytics</h1>
          <p>{isSuperAdmin ? 'Recorded public-project activity across the institute.' : `Recorded activity from accessible projects in ${user?.department || 'your department'}.`}</p>
          <div className="admin-scope-badges"><span>Server-authorized activity</span><span>No page-view tracking</span></div>
        </div>
        <div className="admin-dashboard-mark" aria-hidden="true">↗</div>
      </header>
      <ActivityHeatmap title="Project contribution calendar" eyebrow="RECORDED EVENTS · LAST 12 MONTHS" />
      <ProjectActivityFeed limit={20} />
      <Link to="/admin" className="btn">← Back to overview</Link>
    </section>
  );
}
