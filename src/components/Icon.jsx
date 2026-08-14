export default function Icon({ name, size = 20 }) {
  const paths = {
    today: <><path d="M4 5h16v15H4z"/><path d="M8 3v4M16 3v4M4 10h16"/></>,
    plan: <><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    timer: <><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></>,
    dumbbell: <path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"/></>,
    account: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6"/></>,
  }

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
      {paths[name]}
    </svg>
  )
}
