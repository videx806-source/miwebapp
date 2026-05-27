import { useNavigate } from 'react-router-dom'
import { useRecordings } from '../hooks/useRecordings'
import styles from './Recordings.module.css'

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

function formatDate(ts) {
  return new Date(ts).toLocaleString('es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Recordings() {
  const navigate = useNavigate()
  const { recordings, deleteRecording, clearAll } = useRecordings()

  const handlePlay = (rec) => {
    navigate('/player', {
      state: {
        streamUrl: rec.blobUrl,
        titulo: rec.titulo,
        isLive: false,
      }
    })
  }

  const handleDelete = (rec) => {
    if (confirm(`¿Eliminar "${rec.name}"?`)) {
      if (rec.blobUrl) URL.revokeObjectURL(rec.blobUrl)
      deleteRecording(rec.id)
    }
  }

  const handleClearAll = () => {
    if (confirm('¿Eliminar todas las grabaciones?')) {
      recordings.forEach(r => { if (r.blobUrl) URL.revokeObjectURL(r.blobUrl) })
      clearAll()
    }
  }

  return (
    <div className="page">
      <div className={styles.header}>
        <h1 className={styles.title}>Grabaciones</h1>
        {recordings.length > 0 && (
          <button className={styles.clearBtn} onClick={handleClearAll}>
            Eliminar todo
          </button>
        )}
      </div>

      {recordings.length === 0 ? (
        <div className={styles.empty}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
          <p>Sin grabaciones</p>
          <span>Las grabaciones que hagas aparecerán aquí</span>
        </div>
      ) : (
        <div className={styles.list}>
          {recordings.map(rec => (
            <div key={rec.id} className={styles.item}>
              <div className={styles.itemIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </div>
              <div className={styles.itemInfo}>
                <p className={styles.itemName}>{rec.titulo}</p>
                <p className={styles.itemMeta}>
                  {formatDate(rec.createdAt)}
                  {rec.duration > 0 && ` · ${formatDuration(rec.duration)}`}
                  {rec.size > 0 && ` · ${formatSize(rec.size)}`}
                </p>
              </div>
              <div className={styles.itemActions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => handlePlay(rec)}
                  title="Reproducir"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={() => handleDelete(rec)}
                  title="Eliminar"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
