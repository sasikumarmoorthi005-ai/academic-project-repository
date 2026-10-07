import { Link } from 'react-router-dom';
import { formatDate } from '../services/api';
import Illustration from './Illustration';
import ProjectStars from './ProjectStars';

export default function ProjectCard({ project }) {
  return (
    <Link to={`/projects/${project.id}`} className="card project-card">
      <div className="project-card-heading">
        <div>
          <p className="project-card-kicker">{project.category || 'PROJECT'}</p>
          <h3>{project.title}</h3>
        </div>
        <Illustration type="project" className="project-card-illustration" />
      </div>
      <p>
        {project.description
          ? project.description.length > 110 ? project.description.slice(0, 110) + '…' : project.description
          : 'No description yet'}
      </p>
      <div className="meta">
        {project.category && <span className="badge">{project.category}</span>}
        <span className={`badge ${project.visibility === 'PUBLIC' ? 'public' : project.visibility === 'DEPARTMENT' ? 'department' : ''}`}>
          {project.visibility === 'PUBLIC' ? 'Public – All Departments' : project.visibility === 'DEPARTMENT' ? 'Department Only' : 'Private – Only Me'}
        </span>
      </div>
      <div className="meta">
        <span>{project.ownerName}</span>
        <span>v{project.versionCount}</span>
        <span>{project.fileCount} files</span>
        <span>Updated {formatDate(project.updatedAt)}</span>
      </div>
      {project.visibility === 'PUBLIC' && project.starRating != null && (
        <ProjectStars value={project.starRating} />
      )}
    </Link>
  );
}
