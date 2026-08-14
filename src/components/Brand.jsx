export default function Brand({ onPlan }) {
  return (
    <header className="brand">
      {onPlan ? (
        <button className="brand-home" type="button" onClick={onPlan} aria-label="Open workout plan">
          <img className="brand-mark" src="/aether-icon-128.webp" alt="" />
        </button>
      ) : (
        <img className="brand-mark" src="/aether-icon-128.webp" alt="" />
      )}
      <span>Aether</span>
    </header>
  )
}
