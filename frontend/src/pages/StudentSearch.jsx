import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../services/api';

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
}

function StudentPortrait({ student }) {
  const [photoUrl, setPhotoUrl] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl;
    if (!student.hasProfileImage) {
      setPhotoUrl('');
      return undefined;
    }

    api.get(`/auth/students/${student.id}/photo`, { responseType: 'blob' })
      .then(({ data }) => {
        objectUrl = URL.createObjectURL(data);
        if (active) setPhotoUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch(() => {
        if (active) setPhotoUrl('');
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [student.id, student.hasProfileImage]);

  return (
    <span className={`student-result-avatar ${photoUrl ? 'has-photo' : ''}`}>
      {photoUrl ? <img src={photoUrl} alt="" /> : initials(student.name)}
    </span>
  );
}

export default function StudentSearch() {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  function clearSearch() {
    setQuery('');
    setStudents([]);
    setSearched(false);
    setError('');
  }

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setStudents([]);
      setSearched(false);
      setError('');
      setLoading(false);
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/auth/student-search', { params: { q: term } });
        if (active) {
          setStudents(data);
          setSearched(true);
        }
      } catch (err) {
        if (active) setError(errMsg(err));
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="student-search-page">
      <header className="student-search-hero">
        <div className="student-search-hero-copy">
          <span className="student-search-kicker"><i aria-hidden="true" /> THE STUDENT COMMUNITY</span>
          <h1>Great ideas are<br /><em>better shared.</em></h1>
          <p>Meet the people behind the projects. Find a student and explore their public work, skills, and progress.</p>
          <div className="student-search-hero-tags">
            <span><b aria-hidden="true">✳</b> Student portfolios</span>
            <span><b aria-hidden="true">↗</b> Public project work</span>
          </div>
        </div>
        <div className="student-search-art" aria-hidden="true">
          <div className="student-search-art-orbit orbit-one" />
          <div className="student-search-art-orbit orbit-two" />
          <div className="student-art-card student-art-card-back">
            <span className="student-art-mini-avatar mini-lilac">S</span><i /><i />
          </div>
          <div className="student-art-card student-art-card-front">
            <div className="student-art-card-top"><span>PROJECT SPOTLIGHT</span><b>↗</b></div>
            <div className="student-art-project-mark">✳</div>
            <strong>Ideas in progress</strong>
            <span className="student-art-project-lines"><i /><i /></span>
            <span className="student-art-badge">SHARED WITH YOU</span>
          </div>
          <span className="student-art-float student-art-float-star">✳</span>
          <span className="student-art-float student-art-float-spark">✦</span>
          <span className="student-art-mini-avatar mini-gold">P</span>
        </div>
      </header>

      <section className="card student-search-panel">
        <div className="student-search-input-wrap">
          <span className="student-search-input-icon" aria-hidden="true">⌕</span>
          <label className="sr-only" htmlFor="student-search">Search student names</label>
          <input id="student-search" type="search" value={query} autoComplete="off"
            placeholder="Enter a student name" onChange={(event) => setQuery(event.target.value)} />
          {query && <button className="student-search-clear" type="button" onClick={clearSearch}>Clear</button>}
          <span className="student-search-live"><i aria-hidden="true" /> LIVE SEARCH</span>
        </div>
        <div className="student-search-panel-foot">
          <span><i aria-hidden="true">✓</i> Only public portfolios appear</span>
          <span>Enter 2 or more letters to search</span>
        </div>
      </section>

      {error && <div className="error" role="alert">{error}</div>}
      {loading && (
        <div className="student-search-loading" role="status" aria-label="Searching public portfolios">
          <div className="student-search-results-heading"><span className="workspace-eyebrow">THE DIRECTORY</span><span>Searching…</span></div>
          <div className="student-result-grid">
            {[1, 2, 3].map((item) => <div className="student-result-skeleton" key={item}><i /><span /><span /><b /></div>)}
          </div>
        </div>
      )}
      {!loading && searched && students.length === 0 && !error && (
        <div className="card student-search-empty">
          <span className="student-empty-orbit" aria-hidden="true"><i>⌕</i></span>
          <h2>No public portfolios found</h2>
          <p className="muted">We couldn’t find a match for “{query.trim()}”. Try a different name or spelling.</p>
          <button className="btn" type="button" onClick={clearSearch}>Clear search</button>
        </div>
      )}
      {students.length > 0 && (
        <section className="student-search-results" aria-live="polite">
          <div className="student-search-results-heading">
            <div><span className="workspace-eyebrow">THE DIRECTORY</span><h2>Students to explore</h2></div>
            <span className="student-results-total">{students.length} {students.length === 1 ? 'portfolio' : 'portfolios'}</span>
          </div>
          <div className="student-result-grid">
            {students.map((student, index) => (
              <article className={`card student-result-card student-result-tone-${index % 4}`} key={student.id}>
                <div className="student-result-card-top">
                  <StudentPortrait student={student} />
                  <span className="student-result-open" aria-hidden="true">↗</span>
                </div>
                <div className="student-result-copy">
                  <span className="student-result-kicker">STUDENT PORTFOLIO</span>
                  <h2>{student.name}</h2>
                  <p>{student.course || student.department || 'ProjectVault student'}</p>
                  {student.course && student.department && <span className="student-result-department">{student.department}</span>}
                </div>
                <div className="student-result-card-bottom">
                  <span className="student-result-project-count"><b>{student.publicProjectCount}</b> public {student.publicProjectCount === 1 ? 'project' : 'projects'}</span>
                  <Link className="student-result-link" to={`/students/${student.id}`} aria-label={`Explore ${student.name}'s portfolio`}>
                    Explore portfolio <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <p className="student-results-note"><span aria-hidden="true">✳</span> Showing students who have chosen to share their work.</p>
      </section>
      )}
      {!loading && !searched && (
        <section className="student-discovery-intro">
          <div className="student-discovery-heading">
            <span className="workspace-eyebrow">A LITTLE INSPIRATION</span>
            <h2>Find your next idea</h2>
            <p>Browse a name to discover the work students are proud to share.</p>
          </div>
          <div className="student-discovery-pillars">
            <article><span className="discovery-icon discovery-icon-work" aria-hidden="true">✳</span><div><strong>Real student work</strong><p>Explore projects built by your peers.</p></div></article>
            <article><span className="discovery-icon discovery-icon-progress" aria-hidden="true">↗</span><div><strong>Progress, not just results</strong><p>See how public projects evolve over time.</p></div></article>
            <article><span className="discovery-icon discovery-icon-safe" aria-hidden="true">⌑</span><div><strong>Shared by choice</strong><p>Private work stays private to its owner.</p></div></article>
          </div>
        </section>
      )}
    </div>
  );
}
