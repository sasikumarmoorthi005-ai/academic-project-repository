import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { errMsg } from '../services/api';

const activityIcons = {
  PROJECT_CREATED: '+',
  PROJECT_UPDATED: '↻',
  VERSION_SAVED: 'V',
  FILE_UPLOADED: '↑',
  FILE_DELETED: '−',
  RATING_SET: '★',
  RATING_REMOVED: '−',
};

function activityDate(value) {
  return value ? new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }) : '';
}

export default function ProjectActivityFeed({ projectId, limit }) {
  const { isAdmin } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    const url = projectId ? `/projects/${projectId}/activity` : '/projects/activity';
    async function load() {
      setLoading(true);
      setError('');
      setNotice('');
      try {
        const { data } = await api.get(url);
        let combined = data;
        if (!projectId && !isAdmin) {
          try {
            const { data: profileEvents } = await api.get('/auth/profile/activity');
            combined = combined.concat(profileEvents.map((event, index) => ({
              id: `profile-${event.createdAt}-${index}`,
              activityType: event.activityType,
              description: event.activityType === 'PROFILE_PHOTO_UPDATED'
                ? 'Profile photo updated' : 'Profile details updated',
              createdAt: event.createdAt,
              ownerName: 'You',
            })));
          } catch (profileError) {
            const message = errMsg(profileError);
            if (profileError.response?.status === 404 && message.includes('No static resource')) {
              if (active) setNotice('Profile activity is unavailable on the running backend. Restart it using the updated project source to include profile changes.');
            } else if (active) {
              setNotice(`Profile activity could not be loaded: ${message}`);
            }
          }
        }
        combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (active) setActivities(limit ? combined.slice(0, limit) : combined);
      } catch (err) {
        if (active) {
          const message = errMsg(err);
          setError(err.response?.status === 404 && message.includes('No static resource')
            ? 'Activity feed is not available on the running backend yet. Restart it using the updated project source.'
            : message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [projectId, limit, isAdmin]);

  return (
    <section className="activity-feed-card" aria-label={projectId ? 'Project activity' : 'Recent activity'}>
      <div className="activity-feed-heading">
        <div>
          <p className="workspace-eyebrow">{projectId ? 'PROJECT HISTORY' : isAdmin ? 'ADMIN REVIEW' : 'YOUR WORKSPACE'}</p>
          <h2>{projectId ? 'Recent activity' : 'Recent activity feed'}</h2>
        </div>
        <span className="activity-feed-count">{activities.length}</span>
      </div>
      {error && <div className="error" role="alert">{error}</div>}
      {notice && <p className="muted" role="status">{notice}</p>}
      {loading ? <p className="muted">Loading activity…</p> : activities.length ? (
        <div className="activity-feed-list">
          {activities.map((activity) => (
            <article className="activity-feed-item" key={activity.id}>
              <span className={`activity-feed-icon activity-feed-icon-${activity.activityType.toLowerCase()}`}
                aria-hidden="true">{activityIcons[activity.activityType] || '•'}</span>
              <div className="activity-feed-copy">
                <p>{activity.description}</p>
                <span>
                  {activity.projectId && !projectId && (
                    <><Link to={`/projects/${activity.projectId}`}>{activity.projectTitle}</Link> · </>
                  )}
                  {activity.ownerName} · {activityDate(activity.createdAt)}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : !error ? (
        <p className="activity-feed-empty">No activity has been recorded yet. Project updates, versions, and file changes will appear here.</p>
      ) : null}
    </section>
  );
}
