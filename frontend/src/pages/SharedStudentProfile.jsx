import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg, formatDate } from '../services/api';
import ProjectStars from '../components/ProjectStars';
import ActivityHeatmap from '../components/ActivityHeatmap';

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
}

export default function SharedStudentProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activityError, setActivityError] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/auth/students/${id}`)
      .then((r) => setProfile(r.data))
      .catch((e) => setError(errMsg(e)));
  }, [id]);

  useEffect(() => {
    api.get(`/auth/students/${id}/activity`)
      .then(({ data }) => setActivities(data))
      .catch((e) => setActivityError(errMsg(e)));
  }, [id]);

  useEffect(() => {
    let active = true;
    let objectUrl;
    if (!profile?.hasProfileImage) {
      setPhotoUrl('');
      return undefined;
    }

    api.get(`/auth/students/${profile.id}/photo`, { responseType: 'blob' })
      .then(({ data }) => {
        objectUrl = URL.createObjectURL(data);
        if (active) setPhotoUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch((e) => {
        if (active) setError(errMsg(e));
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profile?.id, profile?.hasProfileImage]);

  if (error) return <div className="error" role="alert">{error}</div>;
  if (!profile) return <p className="muted">Loading student portfolio…</p>;

  const skills = (profile.skills || '').split(',').map((skill) => skill.trim()).filter(Boolean);

  return (
    <section className="profile-page">
      <div className="profile-cover">
        <span className="profile-cover-label">PROJECTVAULT · STUDENT PORTFOLIO</span>
      </div>
      <div className="card profile-intro">
        <div className="profile-avatar-wrap">
          <div className={`profile-avatar ${photoUrl ? 'has-photo' : ''}`} aria-label={`${profile.name} profile photo`}>
            {photoUrl ? <img src={photoUrl} alt={`${profile.name} profile`} /> : initials(profile.name)}
          </div>
        </div>
        <div className="profile-intro-main">
          <h1>{profile.name}</h1>
          <p className="profile-headline">{profile.course || 'Student · Building and sharing projects'}</p>
          <div className="profile-contact">
            {profile.department && <span>{profile.department}</span>}
            <span className="badge public">Student portfolio</span>
            <span className="badge">Average rating {profile.averageProjectRating == null ? '—' : `${profile.averageProjectRating.toFixed(1)} / 5`}</span>
            <span className="badge">{profile.ratedPublicProjectCount} rated projects</span>
            <span className="badge">{profile.totalProjectStars} total stars</span>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-main-column">
          <section className="card profile-section">
            <p className="profile-eyebrow">STUDENT SUMMARY</p>
            <h2>About</h2>
            <p className="profile-summary">{profile.summary || 'This student has not added a summary yet.'}</p>
          </section>

          <section className="card profile-section">
            <p className="profile-eyebrow">PUBLIC WORK</p>
            <h2>Shared projects</h2>
            {profile.projects.length === 0 ? (
              <p className="muted">No projects have been shared on this profile yet.</p>
            ) : (
              <div className="profile-project-list">
                {profile.projects.map((project) => (
                  <article className="profile-project" key={project.id}>
                    <div className="profile-project-mark" aria-hidden="true">
                      {(project.title || 'P').trim().charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-project-body">
                      <div className="profile-project-heading">
                        <h3><Link to={`/projects/${project.id}`}>{project.title}</Link></h3>
                        {project.category && <span className="badge">{project.category}</span>}
                      </div>
                      <p className="profile-project-description">
                        {project.description || 'No project description provided.'}
                      </p>
                      <div className="meta">
                        {project.techStack && <span>{project.techStack}</span>}
                        <span>{project.versionCount} {project.versionCount === 1 ? 'version' : 'versions'}</span>
                        <span>{project.fileCount} {project.fileCount === 1 ? 'file' : 'files'}</span>
                        <span>Updated {formatDate(project.updatedAt)}</span>
                        {project.starRating != null && <ProjectStars value={project.starRating} />}
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
            <p className="profile-eyebrow">EDUCATION</p>
            <h2>Department &amp; course</h2>
            <p className="profile-education">{profile.course || 'Not provided'}</p>
            <p className="muted profile-side-copy">{profile.department || 'Department not provided'}</p>
          </section>
          <section className="card profile-section">
            <p className="profile-eyebrow">TOOLKIT</p>
            <h2>Skills</h2>
            {skills.length ? (
              <div className="profile-skills">{skills.map((skill) => <span className="badge" key={skill}>{skill}</span>)}</div>
            ) : <p className="muted profile-side-copy">No skills listed.</p>}
          </section>
        </aside>
      </div>
      <ActivityHeatmap
        title="Activity & consistency"
        eyebrow="PUBLIC PROJECT WORK · LAST 12 MONTHS"
        activityUrl={`/auth/students/${id}/activity/daily`}
        description="Recorded activity from this student's public projects only."
      />
      <section className="card shared-activity-panel">
        <div className="shared-activity-heading">
          <div>
            <p className="workspace-eyebrow">PUBLIC PROJECTS</p>
            <h2>Recent activity</h2>
          </div>
          <span className="activity-feed-count">{activities.length}</span>
        </div>
        {activities.length ? (
          <div className="activity-feed-list">
            {activities.map((activity) => (
              <article className="activity-feed-item" key={activity.id}>
                <span className="activity-feed-icon" aria-hidden="true">↻</span>
                <div className="activity-feed-copy">
                  <p>{activity.description}</p>
                  <span><Link to={`/projects/${activity.projectId}`}>{activity.projectTitle}</Link> · {formatDate(activity.createdAt)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : activityError ? <p className="muted" role="status">Activity could not be loaded: {activityError}</p>
          : <p className="muted">No public project activity has been recorded in the last six months.</p>}
        <p className="shared-activity-privacy">Project resource access is limited to presentations and documentation. Source code and other files remain private to the owner.</p>
      </section>
    </section>
  );
}
