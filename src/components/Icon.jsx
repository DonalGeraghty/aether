import { HABIT_ICON_COMPONENTS } from '../data/habitIconComponents.js'

export default function Icon({ name, size = 20 }) {
  const paths = {
    book: <><path d="M12 5v16M12 5C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 1" /></>,
    walk: <><circle cx="14" cy="4" r="2" /><path d="m7 21 4-7 3 3v5M8 10l4-3 4 5 4 1M12 7l-1 7" /></>,
    leaf: <><path d="M20 3C9 2 3 8 5 15c2 7 15 5 15-12ZM3 21l12-12" /></>,
    water: <><path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1" /></>,
    moon: <path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z" />,
    heart: <path d="m12 21-8-8C-3 6 7-2 12 6c5-8 15 0 8 7Z" />,
    sparkles: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" /><path d="M20 2v4M18 4h4" /></>,
    today: <><path d="M4 5h16v15H4z"/><path d="M8 3v4M16 3v4M4 10h16"/></>,
    plan: <><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    timer: <><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></>,
    dumbbell: <path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>,
    logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"/></>,
    account: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6"/></>,
  }

  const Component = HABIT_ICON_COMPONENTS[name]
  if (!paths[name] && Component) return <Component aria-hidden="true" size={size} strokeWidth={1.8} />

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] || paths.check}
    </svg>
  )
}
