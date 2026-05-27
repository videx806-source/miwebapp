import { useState } from 'react'
import styles from './Config.module.css'

const QUALITY_OPTIONS = ['Auto', '1080p', '720p', '480p', '360p']
const BUFFER_OPTIONS = ['15s', '30s', '60s', '120s']

function usePref(key, def) {
  const [val, setVal] = useState(() => localStorage.getItem(key) || def)
  const set = (v) => { setVal(v); localStorage.setItem(key, v) }
  return [val, set]
}

function usePrefBool(key, def) {
  const [val, setVal] = useState(() => {
    const stored = localStorage.getItem(key)
    return stored === null ? def : stored === 'true'
  })
  const set = (v) => { setVal(v); localStorage.setItem(key, String(v)) }
  return [val, set]
}

function Row({ label, sub, children, onClick }) {
  return (
    <div className={`${styles.row} ${onClick ? styles.rowClickable : ''}`} onClick={onClick}>
      <div className={styles.rowText}>
        <span className={styles.rowLabel}>{label}</span>
        {sub && <span className={styles.rowSub}>{sub}</span>}
      </div>
      {children && <div className={styles.rowRight}>{children}</div>}
    </div>
  )
}

function SelectSheet({ options, value, onChange, onClose }) {
  return (
    <div className={styles.sheetOverlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        {options.map(opt => (
          <button
            key={opt}
            className={`${styles.sheetOpt} ${value === opt ? styles.sheetOptActive : ''}`}
            onClick={() => { onChange(opt); onClose() }}
          >
            {opt}
            {value === opt && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Config() {
  const [quality, setQuality] = usePref('default_quality', 'Auto')
  const [buffer, setBuffer] = usePref('buffer_seconds', '30s')
  const [autoplay, setAutoplay] = usePrefBool('autoplay', true)
  const [sheet, setSheet] = useState(null)

  return (
    <div className="page">
      <h1 className={styles.title}>Configuración</h1>

      {/* Reproducción */}
      <div className={styles.group}>
        <p className={styles.groupTitle}>Reproducción</p>
        <div className={styles.card}>
          <Row
            label="Calidad por defecto"
            sub={quality}
            onClick={() => setSheet('quality')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Row>
          <div className={styles.divider} />
          <Row
            label="Búfer de red"
            sub={buffer}
            onClick={() => setSheet('buffer')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Row>
          <div className={styles.divider} />
          <Row label="Reproducción automática">
            <button
              className={`${styles.toggle} ${autoplay ? styles.toggleOn : ''}`}
              onClick={() => setAutoplay(!autoplay)}
            >
              <span className={styles.toggleThumb} />
            </button>
          </Row>
        </div>
      </div>

      {/* Grabaciones */}
      <div className={styles.group}>
        <p className={styles.groupTitle}>Grabaciones</p>
        <div className={styles.card}>
          <Row label="Almacenamiento" sub="Sesión del navegador (localStorage)" />
          <div className={styles.divider} />
          <Row
            label="Limpiar grabaciones"
            onClick={() => {
              if (confirm('¿Eliminar todas las grabaciones?')) {
                localStorage.removeItem('videx_recordings')
                alert('Grabaciones eliminadas.')
              }
            }}
          >
            <span className={styles.danger}>Eliminar</span>
          </Row>
        </div>
      </div>

      {/* Sobre VIDEX */}
      <div className={styles.group}>
        <p className={styles.groupTitle}>Sobre VIDEX</p>
        <div className={styles.card}>
          <Row label="Versión" sub="1.0.0" />
          <div className={styles.divider} />
          <Row
            label="Sitio web"
            sub="videx.lol"
            onClick={() => window.open('https://videx.lol', '_blank')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </Row>
          <div className={styles.divider} />
          <Row
            label="API"
            sub="api.videx.lol"
            onClick={() => window.open('https://api.videx.lol', '_blank')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </Row>
        </div>
      </div>

      {/* Bottom label */}
      <p className={styles.footer}>VIDEX · videx.lol</p>

      {/* Sheets */}
      {sheet === 'quality' && (
        <SelectSheet
          options={QUALITY_OPTIONS}
          value={quality}
          onChange={setQuality}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'buffer' && (
        <SelectSheet
          options={BUFFER_OPTIONS}
          value={buffer}
          onChange={setBuffer}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  )
}
