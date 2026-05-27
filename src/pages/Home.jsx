import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CHANNELS, GROUPS, GROUP_COLORS, buildStreamUrl } from '../data/channels'
import EventCard from '../components/EventCard'
import styles from './Home.module.css'

function GroupDot({ group }) {
  const color = GROUP_COLORS[group] || '#666'
  return <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:color, flexShrink:0 }} />
}

export default function Home() {
  const navigate = useNavigate()
  const [activeGroup, setActiveGroup] = useState('TODOS')
  const [search, setSearch] = useState('')
  const [eventos, setEventos] = useState([])
  const [eventosLoading, setEventosLoading] = useState(true)

  useEffect(() => {
    fetch('https://api.videx.lol/eventos.json')
      .then(r => r.json())
      .then(d => setEventos(d.eventos || []))
      .catch(() => setEventos([]))
      .finally(() => setEventosLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return CHANNELS.filter(ch => {
      const matchGroup = activeGroup === 'TODOS' || ch.group === activeGroup
      const matchSearch = ch.name.toLowerCase().includes(search.toLowerCase())
      return matchGroup && matchSearch
    })
  }, [activeGroup, search])

  const liveCount = eventos.filter(e => e.estado === 'en_vivo').length

  const handleChannel = (ch) => {
    navigate('/player', {
      state: {
        streamUrl: buildStreamUrl(ch.path),
        titulo: ch.name,
        isLive: true,
      }
    })
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.logo}>VID<span>EX</span></span>
        <span className={styles.tagline}>Streaming en vivo</span>
      </header>

      {/* EVENTOS */}
      <section className={styles.section}>
        <div className="section-header">
          <span className="section-title">Eventos Deportivos</span>
          {liveCount > 0 && <span className="section-badge">{liveCount} EN VIVO</span>}
        </div>

        {eventosLoading ? (
          <div className="scroll-row">
            {[1,2,3].map(i => (
              <div key={i} className={styles.eventSkeleton} />
            ))}
          </div>
        ) : eventos.length === 0 ? (
          <div className={styles.emptyEvents}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
            <span>Sin eventos disponibles</span>
          </div>
        ) : (
          <div className="scroll-row">
            {eventos.map(ev => <EventCard key={ev.id} evento={ev} />)}
          </div>
        )}
      </section>

      {/* CANALES */}
      <section className={styles.section}>
        <div className="section-header">
          <span className="section-title">Canales</span>
          <span className={styles.channelCount}>{filtered.length}</span>
        </div>

        {/* Group tabs */}
        <div className={styles.groupTabs}>
          {GROUPS.map(g => (
            <button
              key={g}
              className={`${styles.groupTab} ${activeGroup === g ? styles.groupTabActive : ''}`}
              style={activeGroup === g && g !== 'TODOS' ? {
                '--tab-color': GROUP_COLORS[g],
                borderColor: GROUP_COLORS[g],
                color: GROUP_COLORS[g],
                background: GROUP_COLORS[g] + '18',
              } : activeGroup === g ? {
                borderColor: 'var(--accent)',
                color: 'var(--accent)',
                background: 'var(--accent-glow)',
              } : {}}
              onClick={() => setActiveGroup(g)}
            >
              {g !== 'TODOS' && <GroupDot group={g} />}
              {g}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar canal..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch('')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Chips */}
        <div className={styles.chipsWrap}>
          {filtered.length === 0 ? (
            <p className={styles.noResults}>Sin resultados para "{search}"</p>
          ) : (
            filtered.map((ch, i) => {
              const color = GROUP_COLORS[ch.group] || '#666'
              return (
                <button
                  key={i}
                  className={styles.chip}
                  style={{ '--chip-color': color }}
                  onClick={() => handleChannel(ch)}
                >
                  {ch.name}
                </button>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
