import { useEffect, useMemo, useState } from 'react';
import api, { errMsg } from '../services/api';

function localDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function summaryText(day) {
  return `${day.date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}: ${day.total} recorded activities. ${day.projectsCreated} projects created, ${day.projectsUpdated} projects updated, ${day.versionsSaved} versions saved, ${day.filesUploaded} files uploaded, ${day.ratingsSet} ratings set, ${day.ratingsRemoved} ratings removed.`;
}

export default function ActivityHeatmap({
  title = 'Activity consistency',
  eyebrow = 'LAST 12 MONTHS',
  activityUrl = '/projects/activity/daily',
  description = 'Daily project work recorded in your authorized workspace.',
}) {
  const today = useMemo(() => new Date(), []);
  const from = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 364);
    return date;
  }, [today]);
  const [summaries, setSummaries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setSummaries([]);
    setSelectedDate(null);
    api.get(activityUrl, {
      params: { from: localDateString(from), to: localDateString(today) },
    }).then(({ data }) => {
      if (active) setSummaries(data);
    }).catch((err) => {
      if (active) {
        const message = errMsg(err);
        setError(err.response?.status === 404 && message.includes('No static resource')
          ? 'Daily activity analytics are not available on the running backend yet. Restart the backend using the updated application source.'
          : message);
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [activityUrl, from, today]);

  const activity = useMemo(() => {
    const byDate = new Map(summaries.map((item) => [item.date, item]));
    const start = new Date(from);
    start.setDate(start.getDate() - start.getDay());
    const days = [];
    for (let offset = 0; offset < 371; offset += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + offset);
      if (date > today) break;
      const item = byDate.get(localDateString(date));
      days.push({
        date,
        total: item?.total || 0,
        projectsCreated: item?.projectsCreated || 0,
        projectsUpdated: item?.projectsUpdated || 0,
        versionsSaved: item?.versionsSaved || 0,
        filesUploaded: item?.filesUploaded || 0,
        ratingsSet: item?.ratingsSet || 0,
        ratingsRemoved: item?.ratingsRemoved || 0,
        inRange: date >= from,
      });
    }
    return days;
  }, [from, summaries, today]);

  const weeks = useMemo(() => {
    const result = [];
    for (let index = 0; index < activity.length; index += 7) result.push(activity.slice(index, index + 7));
    return result;
  }, [activity]);
  const activeDays = activity.filter((day) => day.inRange && day.total > 0).length;
  const totalEvents = summaries.reduce((sum, day) => sum + day.total, 0);
  let streak = 0;
  for (let index = activity.length - 1; index >= 0 && activity[index].total > 0; index -= 1) streak += 1;
  const selected = selectedDate ? activity.find((day) => localDateString(day.date) === selectedDate) : null;

  return (
    <section className="card activity-heatmap-card">
      <header className="activity-heatmap-heading">
        <div>
          <p className="workspace-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="muted">{description}</p>
        </div>
          <div className="activity-heatmap-stats">
            <span><strong>{loading || error ? '—' : activeDays}</strong> active days</span>
            <span><strong>{loading || error ? '—' : totalEvents}</strong> contributions</span>
            <span><strong>{loading || error ? '—' : streak}</strong> day streak</span>
        </div>
      </header>
        {error ? <p className="error" role="alert">Activity calendar could not be loaded: {error}</p>
          : loading ? <p className="muted">Loading activity calendar…</p> : (
        <>
          <div className="activity-heatmap-scroll">
            <div className="activity-heatmap-months" aria-hidden="true">
              {weeks.map((week, index) => {
                const month = week.find((day) => day.inRange && day.date.getDate() <= 7);
                return <span key={index}>{month?.date.toLocaleDateString(undefined, { month: 'short' }) || ''}</span>;
              })}
            </div>
            <div className="activity-heatmap-body">
              <div className="activity-heatmap-weekdays" aria-hidden="true">
                <span>Sun</span><span /><span>Tue</span><span /><span>Thu</span><span /><span>Sat</span>
              </div>
              <div className="activity-heatmap-weeks">
                {weeks.map((week, weekIndex) => (
                  <div className="activity-heatmap-week" key={weekIndex}>
                    {week.map((day) => {
                      const level = day.total === 0 ? 0 : day.total < 3 ? 1 : day.total < 6 ? 2 : day.total < 10 ? 3 : 4;
                      return (
                        <button key={localDateString(day.date)}
                          type="button"
                          className={`activity-heatmap-cell level-${level}${day.inRange ? '' : ' outside-range'}`}
                          title={summaryText(day)}
                          aria-label={summaryText(day)}
                          aria-pressed={selectedDate === localDateString(day.date)}
                          onClick={() => setSelectedDate(localDateString(day.date))} />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="activity-heatmap-footer">
            {selected ? <p className="activity-heatmap-selected" role="status">{summaryText(selected)}</p>
              : <p className="muted">Select a day for its activity summary. Counts reflect recorded events only.</p>}
            <div className="activity-heatmap-legend" aria-label="Activity intensity">
              <span>Less</span><i className="level-0" /><i className="level-1" /><i className="level-2" /><i className="level-3" /><i className="level-4" /><span>More</span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
