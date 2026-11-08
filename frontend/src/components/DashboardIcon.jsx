export default function DashboardIcon({ name, className = '' }) {
  const paths = {
    home: <path d="m3 10 9-7 9 7v11h-6v-7H9v7H3Z" />,
    controls: <><path d="M5 3v7m0 6v7M12 3v13m0 6v1M19 3v2m0 6v12" /><circle cx="5" cy="13" r="3" /><circle cx="12" cy="19" r="3" /><circle cx="19" cy="8" r="3" /></>,
    history: <path d="m2 18 7-8 6 5 7-10" />,
    mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m3 6 9 8 9-8" /></>,
    layers: <><path d="m2 7 10-5 10 5-10 5Zm0 6 10 5 10-5M2 19l10 5 10-5" /></>,
    drop: <path d="M12 2S4 11 4 16a8 8 0 0 0 16 0c0-5-8-14-8-14Z" />,
    temperature: <><path d="M9 14V5a3 3 0 0 1 6 0v9a6 6 0 1 1-6 0Z" /><path d="M12 8v10" /><circle cx="12" cy="19" r="2" fill="currentColor" stroke="none" /></>,
    warning: <><path d="M10.3 3.5 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z" /><path d="M12 9v5m0 3v.2" /></>,
    check: <path d="m6 12 4 4 8-9" />,
    user: <><circle cx="12" cy="7" r="4" fill="currentColor" stroke="none" /><path d="M4 22v-3a8 8 0 0 1 16 0v3Z" fill="currentColor" stroke="none" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    sprout: <><path d="M12 24V11M12 17C5 18 2 13 2 8c7-1 10 3 10 9ZM12 12c0-7 4-10 11-9 0 6-4 10-11 9Z" /><path d="m6 12 6 5m0-5 6-5" /></>,
    sprinkler: <><path d="M5 23h14M9 23v-8h6v8M7 15h10M12 10V3M7 11 3 6m14 5 4-5M4 14H1m22 0h-3M7 4l1 2m9-2-1 2" /></>,
    clock: <><circle cx="12" cy="13" r="10" /><path d="M12 7v6l4 3" /></>,
    phone: <path d="M21 18v3a2 2 0 0 1-2.2 2A19 19 0 0 1 2 6.2 2 2 0 0 1 4 4h3a1 1 0 0 1 1 1l.5 3a1 1 0 0 1-.6 1.1l-1.4.7a15 15 0 0 0 7.7 7.7l.7-1.4a1 1 0 0 1 1.1-.6l3 .5a1 1 0 0 1 1 1Z" />,
  }
  return <svg className={className} viewBox="0 0 24 26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
