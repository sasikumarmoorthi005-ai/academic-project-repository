export const fileCategories = [
  { value: 'SOURCE_CODE', label: 'Source code' },
  { value: 'DOCUMENTATION', label: 'Documentation' },
  { value: 'PRESENTATION', label: 'Presentations' },
];

export default function FileCategoryInputs({ idPrefix, files = {}, onChange }) {
  return (
    <div className="file-category-grid">
      {fileCategories.map(({ value, label }) => {
        const id = `${idPrefix}-${value.toLowerCase()}`;
        return (
          <div className="field file-category-field" key={value}>
            <span className="file-category-icon" aria-hidden="true">
              {value === 'SOURCE_CODE' ? '</>' : value === 'DOCUMENTATION' ? 'Aa' : '▤'}
            </span>
            <label htmlFor={id}>{label}</label>
            <input id={id} type="file" multiple
              onChange={(event) => onChange(value, [...event.target.files])} />
            {files[value]?.length > 0 && (
              <ul className="selected-file-list">
                {files[value].map((file) => <li key={`${file.name}-${file.lastModified}`}>{file.name}</li>)}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
