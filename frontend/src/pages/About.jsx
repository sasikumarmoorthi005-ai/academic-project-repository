import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const studentFeatures = [
  {
    mark: '01',
    title: 'Build your project space',
    description: 'Keep project details, categorized files, documentation, presentations, and source materials organized together.',
  },
  {
    mark: '02',
    title: 'Save your progress',
    description: 'Create project versions with notes, revisit earlier work, and follow updates in your activity feed.',
  },
  {
    mark: '03',
    title: 'Choose what to share',
    description: 'Make selected projects public for discovery. Your private projects remain visible only to you.',
  },
  {
    mark: '04',
    title: 'Discover your community',
    description: 'Find students, explore their public portfolios, and view presentations and documentation they have shared.',
  },
];

const adminFeatures = [
  {
    mark: '01',
    title: 'Review public projects',
    description: 'Browse student work that has been intentionally shared and open public project details.',
  },
  {
    mark: '02',
    title: 'Rate and encourage',
    description: 'Give public projects a 1–5 star rating. Students can see the rating on their shared work.',
  },
  {
    mark: '03',
    title: 'Discover student portfolios',
    description: 'Search students with public work and view their profile, shared projects, and public project activity.',
  },
  {
    mark: '04',
    title: 'Respect project privacy',
    description: 'Private projects are not available to admins. In public projects, only documentation and presentations are accessible.',
  },
];

export default function About() {
  const { isAdmin } = useAuth();
  const features = isAdmin ? adminFeatures : studentFeatures;

  return (
    <div className={`about-page ${isAdmin ? 'about-page-admin' : 'about-page-student'}`}>
      <section className={`about-hero ${isAdmin ? 'about-hero-admin' : 'about-hero-student'}`}>
        <div className="about-hero-copy">
          <p className="workspace-eyebrow">{isAdmin ? 'ADMINISTRATOR GUIDE' : 'STUDENT GUIDE'}</p>
          <h1>{isAdmin ? 'Discover the work students choose to share.' : 'Your work, progress, and portfolio — all together.'}</h1>
          <p>{isAdmin
            ? 'ProjectVault gives you a focused workspace to discover public student projects, review shared resources, and recognize great work.'
            : 'ProjectVault is your space to organize academic projects, keep every version, and build a portfolio you control.'}</p>
          <Link className="btn btn-primary" to={isAdmin ? '/admin' : '/projects'}>
            {isAdmin ? 'Open admin dashboard' : 'Open my projects'}
          </Link>
        </div>
        <div className="about-hero-art" aria-hidden="true">
          <div className="about-art-window">
            <span className="about-art-dots"><i /><i /><i /></span>
            <div className="about-art-folder">PV</div>
            <div className="about-art-lines"><i /><i /><i /></div>
            <span className="about-art-version">{isAdmin ? 'PUBLIC WORK · REVIEW' : 'VERSION 04 · SAVED'}</span>
          </div>
          <span className="about-art-orbit about-art-orbit-one" />
          <span className="about-art-orbit about-art-orbit-two" />
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-heading">
          <p className="workspace-eyebrow">{isAdmin ? 'YOUR ADMIN TOOLKIT' : 'YOUR PROJECT TOOLKIT'}</p>
          <h2>{isAdmin ? 'Review with clarity and care' : 'Make every step of your work count'}</h2>
          <p className="muted">{isAdmin
            ? 'A clear view of public student work, with privacy boundaries built in.'
            : 'From the first project details to a portfolio ready to share.'}</p>
        </div>
        <div className="about-feature-grid">
          {features.map((feature) => (
            <article className="card about-feature" key={feature.mark}>
              <span className="about-feature-mark">{feature.mark}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`about-role-highlight ${isAdmin ? 'about-role-highlight-admin' : 'about-role-highlight-student'}`}>
        <span className={`about-role-icon ${isAdmin ? 'about-role-icon-admin' : ''}`} aria-hidden="true">
          {isAdmin ? 'A' : 'S'}
        </span>
        <div>
          <p className="workspace-eyebrow">{isAdmin ? 'ADMIN ACCESS' : 'YOUR SPACE, YOUR CHOICE'}</p>
          <h2>{isAdmin ? 'Public work only. Student privacy always.' : 'Your projects stay under your control.'}</h2>
          <p>{isAdmin
            ? 'You can review public projects and student portfolios. Private projects stay inaccessible, and source code is not available to non-owners.'
            : 'You decide which projects are public. Other signed-in users can view shared presentations and documentation, while source code and private projects remain yours.'}</p>
        </div>
      </section>

      <footer className="about-footer">
        <strong>ProjectVault</strong>
        <span>{isAdmin
          ? 'Discover student work. Recognize progress. Protect privacy.'
          : 'Organize your work. Keep your progress. Share what you’re proud of.'}</span>
      </footer>
    </div>
  );
}
