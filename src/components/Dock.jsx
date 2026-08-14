import Icon from './Icon.jsx'

const items = [
  { id: 'today', label: 'Today', icon: 'today' },
  { id: 'plan', label: 'Plan', icon: 'plan' },
  { id: 'history', label: 'History', icon: 'history' },
  { id: 'account', label: 'Account', icon: 'account' },
]

export default function Dock({ page, onChange, onLogout }) {
  return (
    <div className="dock-outer">
      <nav className="dock" aria-label="Primary navigation">
        {items.map((item) => (
          <button
            className="dock-item"
            type="button"
            key={item.id}
            onClick={() => onChange(item.id)}
            aria-label={item.label}
            aria-current={page === item.id ? 'page' : undefined}
          >
            <span className="dock-label">{item.label}</span>
            <Icon name={item.icon} size={21} />
          </button>
        ))}
        <span className="dock-divider" aria-hidden="true" />
        <button
          className="dock-item"
          type="button"
          onClick={onLogout}
          aria-label="Sign out"
        >
          <span className="dock-label">Sign out</span>
          <Icon name="logout" size={21} />
        </button>
      </nav>
    </div>
  )
}
