import Brand from '../components/Brand.jsx'
import Icon from '../components/Icon.jsx'
import { equipment, workouts } from '../data/workouts.js'

export default function PlanPage({ selectedId, onChoose }) {
  return (
    <main className="page content-page">
      <Brand />
      <section className="content-hero">
        <p className="eyebrow">Three days · after work</p>
        <h1>The week.</h1>
        <p>Progressive strength and rowing, built around the equipment already at home.</p>
      </section>

      <section className="plan-grid">
        {workouts.map((workout, index) => (
          <button
            className={`plan-card ${selectedId === workout.id ? 'is-selected' : ''}`}
            type="button"
            key={workout.id}
            onClick={() => onChoose(workout.id)}
          >
            <span className="plan-index">0{index + 1}</span>
            <div>
              <span>{workout.day} · {workout.duration} min</span>
              <h2>{workout.title}</h2>
              <p>{workout.focus}</p>
            </div>
            <Icon name="arrow" size={20} />
          </button>
        ))}
      </section>

      <section className="equipment-section">
        <div className="section-title">
          <p className="eyebrow">Your setup</p>
          <h2>Everything you need.</h2>
        </div>
        <div className="equipment-grid">
          {equipment.map((item) => (
            <article key={item.name}>
              <Icon name="dumbbell" size={21} />
              <div><strong>{item.name}</strong><span>{item.detail}</span></div>
            </article>
          ))}
        </div>
      </section>

      <aside className="rule-card">
        <span>Consistency rule</span>
        <p>
          The scheduled hour is the commitment. Lower the load or pace on a low-energy day,
          but keep the appointment.
        </p>
      </aside>
    </main>
  )
}
