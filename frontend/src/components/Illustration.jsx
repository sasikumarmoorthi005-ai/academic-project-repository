export default function Illustration({ type = 'project', className = '' }) {
  if (type === 'empty') {
    return (
      <svg className={className} viewBox="0 0 220 150" fill="none" role="img" aria-label="An empty project folder">
        <ellipse cx="110" cy="132" rx="75" ry="8" fill="#E9E7F2" />
        <path d="M51 50a8 8 0 0 1 8-8h39l13 13h50a8 8 0 0 1 8 8v47a9 9 0 0 1-9 9H60a9 9 0 0 1-9-9V50Z" fill="#ECE8FF" stroke="#BEB5EA" strokeWidth="2" />
        <path d="M51 67h118l-11 41a10 10 0 0 1-10 8H62a10 10 0 0 1-10-8L51 67Z" fill="#fff" stroke="#D8D3EC" strokeWidth="2" />
        <path d="M81 89h58M89 99h42" stroke="#C7C0E5" strokeWidth="4" strokeLinecap="round" />
        <circle cx="163" cy="39" r="15" fill="#F5E9CF" />
        <path d="M163 31v16m-8-8h16" stroke="#B7791F" strokeWidth="2.5" strokeLinecap="round" />
        <path d="m39 59 4-5m139 23 5 2m-34-42 3-5" stroke="#8C7DD0" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === 'files') {
    return (
      <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect x="11" y="14" width="33" height="40" rx="6" fill="#EDE9FF" />
        <path d="M20 25h15M20 32h15M20 39h10" stroke="#8C7DD0" strokeWidth="3" strokeLinecap="round" />
        <path d="M38 12h8a5 5 0 0 1 5 5v29a5 5 0 0 1-5 5h-2" stroke="#B9AFE7" strokeWidth="3" strokeLinecap="round" />
        <circle cx="47" cy="45" r="10" fill="#F6EBD5" />
        <path d="m43 45 3 3 5-6" stroke="#A66D18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === 'versions') {
    return (
      <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle cx="30" cy="32" r="21" fill="#ECE8FF" />
        <path d="M30 20v13l9 6" stroke="#6853C2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 13v10h10M18 23a18 18 0 1 1-2 17" stroke="#9A8BE1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="48" cy="48" r="8" fill="#F6EBD5" />
        <path d="m45 48 2 2 4-5" stroke="#A66D18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === 'shared') {
    return (
      <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle cx="23" cy="23" r="9" fill="#E9E5FB" />
        <circle cx="43" cy="25" r="7" fill="#F4E8D0" />
        <path d="M8 49c1-9 7-14 15-14s14 5 15 14" fill="#C9C0EF" />
        <path d="M37 38c2-3 5-5 9-5 7 0 11 5 12 12" fill="#E8CFA2" />
        <path d="m29 28 7-3m-8 8 9 6" stroke="#7664C7" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M8 18a5 5 0 0 1 5-5h15l6 7h17a5 5 0 0 1 5 5v23a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5V18Z" fill="#EEEAFE" />
      <path d="M8 27h48l-5 19a5 5 0 0 1-5 4H17a5 5 0 0 1-5-4L8 27Z" fill="#DCD5FB" />
      <path d="m26 38 4 4 8-9" stroke="#6752C0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
