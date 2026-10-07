export default function ProjectStars({ value, onChange, disabled = false }) {
  const rating = value || 0;

  if (!onChange) {
    return (
      <span className="project-stars-display" role="img"
        aria-label={rating ? `Admin rating: ${rating} out of 5 stars` : 'Not rated by admin'}>
        <span aria-hidden="true">{[1, 2, 3, 4, 5].map((star) => (
          <span className={star <= rating ? 'project-star-filled' : 'project-star-empty'} key={star}>
            {star <= rating ? '★' : '☆'}
          </span>
        ))}</span>
        {rating > 0 && <strong>{rating}/5</strong>}
        {!rating && <span className="project-stars-unrated">Not rated</span>}
      </span>
    );
  }

  return (
    <div className="project-stars-control" role="group" aria-label="Set project rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button type="button" key={star} disabled={disabled}
          className={star <= rating ? 'project-star-filled' : 'project-star-empty'}
          aria-label={`Rate ${star} out of 5 stars`} aria-pressed={rating === star}
          onClick={() => onChange(star)}>
          {star <= rating ? '★' : '☆'}
        </button>
      ))}
      <span>{rating ? `${rating} / 5` : 'Choose a rating'}</span>
    </div>
  );
}
