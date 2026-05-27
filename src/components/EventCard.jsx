import { useNavigate } from 'react-router-dom'
import styles from './EventCard.module.css'

function formatDateTime(fecha, hora) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    let day = fecha === today ? 'HOY' : fecha === tomorrow ? 'MAÑANA' : fecha
    return `${hora} · ${day}`
  } catch { return hora }
}

export default function EventCard({ evento }) {
  const navigate = useNavigate()
  const isLive = evento.estado === 'en_vivo'
  const isDone = evento.estado === 'finalizado'

  const handleClick = () => {
    if (isDone) return
    navigate('/player', {
      state: {
        streamUrl: evento.stream_url,
        titulo: evento.titulo,
        isLive,
      }
    })
  }

  return (
    <div
      className={`${styles.card} ${isDone ? styles.done : ''}`}
      onClick={handleClick}
    >
      <div className={styles.imageWrap}>
        {evento.imagen_url ? (
          <img
            src={evento.imagen_url}
            alt={evento.titulo}
            className={styles.image}
            loading="lazy"
            onError={e => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
        )}
        <div className={styles.ligaBadge}>{evento.liga}</div>
        {isLive && (
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            EN VIVO
          </div>
        )}
        {isDone && <div className={styles.doneMask}><span>FINALIZADO</span></div>}
      </div>
      <div className={styles.info}>
        <p className={styles.title}>{evento.titulo}</p>
        <p className={styles.equipos}>{evento.equipos}</p>
        {!isDone && (
          <p className={styles.time}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {formatDateTime(evento.fecha, evento.hora)}
          </p>
        )}
      </div>
    </div>
  )
}
