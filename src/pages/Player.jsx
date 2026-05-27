import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Hls from 'hls.js'
import { useRecordings } from '../hooks/useRecordings'
import styles from './Player.module.css'

const QUALITIES = [
  { label: 'Auto', width: Infinity, height: Infinity },
  { label: '1080p', width: 1920, height: 1080 },
  { label: '720p', width: 1280, height: 720 },
  { label: '480p', width: 854, height: 480 },
  { label: '360p', width: 640, height: 360 },
]

export default function Player() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { addRecording } = useRecordings()

  const videoRef = useRef(null)
  const hlsRef = useRef(null)
  const recIntervalRef = useRef(null)
  const recChunksRef = useRef([])
  const recStartRef = useRef(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [recTime, setRecTime] = useState(0)
  const [showQuality, setShowQuality] = useState(false)
  const [activeQuality, setActiveQuality] = useState(0)
  const [hlsLevels, setHlsLevels] = useState([])
  const [error, setError] = useState(null)
  const [showControls, setShowControls] = useState(true)
  const controlTimerRef = useRef(null)

  const streamUrl = state?.streamUrl
  const titulo = state?.titulo || 'Canal'
  const isLive = state?.isLive !== false

  // Load stream
  useEffect(() => {
    if (!streamUrl || !videoRef.current) return
    setError(null)
    setIsBuffering(true)
    const video = videoRef.current

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        startLevel: -1,
        enableWorker: true,
      })
      hlsRef.current = hls
      hls.loadSource(streamUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setHlsLevels(data.levels)
        video.play().catch(() => {})
      })
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setError('Error al cargar el stream. Intenta otro canal.')
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl
      video.play().catch(() => {})
    } else {
      setError('Tu navegador no soporta HLS.')
    }

    const onWaiting = () => setIsBuffering(true)
    const onPlaying = () => { setIsBuffering(false); setIsPlaying(true) }
    const onPause = () => setIsPlaying(false)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('playing', onPlaying)
    video.addEventListener('pause', onPause)

    return () => {
      hlsRef.current?.destroy()
      hlsRef.current = null
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('pause', onPause)
    }
  }, [streamUrl])

  // Auto-hide controls
  const resetControlTimer = useCallback(() => {
    setShowControls(true)
    clearTimeout(controlTimerRef.current)
    controlTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3500)
  }, [isPlaying])

  useEffect(() => {
    resetControlTimer()
    return () => clearTimeout(controlTimerRef.current)
  }, [isPlaying])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play()
    else video.pause()
    resetControlTimer()
  }

  // Quality
  const applyQuality = (idx) => {
    setActiveQuality(idx)
    setShowQuality(false)
    const q = QUALITIES[idx]
    if (!hlsRef.current) return
    if (idx === 0) {
      hlsRef.current.currentLevel = -1
    } else {
      const levelIdx = hlsLevels.findIndex(l => l.height <= q.height)
      hlsRef.current.currentLevel = levelIdx >= 0 ? levelIdx : hlsLevels.length - 1
    }
  }

  // Recording (segment-based via fetch)
  const startRecording = useCallback(async () => {
    if (!streamUrl) return
    setIsRecording(true)
    recChunksRef.current = []
    recStartRef.current = Date.now()
    setRecTime(0)

    recIntervalRef.current = setInterval(() => {
      setRecTime(Math.floor((Date.now() - recStartRef.current) / 1000))
    }, 1000)

    // Fetch the M3U8 and download segments
    const downloadSegments = async () => {
      try {
        const m3u8Res = await fetch(streamUrl)
        const m3u8Text = await m3u8Res.text()
        const base = streamUrl.substring(0, streamUrl.lastIndexOf('/') + 1)
        const lines = m3u8Text.split('\n')
        const segsDownloaded = new Set()
        let running = true

        const fetchLoop = async () => {
          while (running) {
            const res = await fetch(streamUrl)
            const text = await res.text()
            const segLines = text.split('\n').filter(l => l.trim() && !l.startsWith('#'))
            for (const seg of segLines) {
              if (!segsDownloaded.has(seg)) {
                segsDownloaded.add(seg)
                const segUrl = seg.startsWith('http') ? seg : base + seg
                try {
                  const segRes = await fetch(segUrl)
                  const buf = await segRes.arrayBuffer()
                  recChunksRef.current.push(buf)
                } catch {}
              }
            }
            await new Promise(r => setTimeout(r, 2000))
            if (!recIntervalRef.current) { running = false }
          }
        }
        fetchLoop()
      } catch {}
    }

    downloadSegments()
  }, [streamUrl])

  const stopRecording = useCallback(() => {
    clearInterval(recIntervalRef.current)
    recIntervalRef.current = null
    setIsRecording(false)

    if (recChunksRef.current.length === 0) return

    const totalLength = recChunksRef.current.reduce((s, b) => s + b.byteLength, 0)
    const merged = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of recChunksRef.current) {
      merged.set(new Uint8Array(chunk), offset)
      offset += chunk.byteLength
    }

    const blob = new Blob([merged], { type: 'video/mp2t' })
    const url = URL.createObjectURL(blob)
    const ts = Date.now()
    const duration = Math.floor((ts - recStartRef.current) / 1000)
    const name = `${titulo}_${new Date(ts).toLocaleString('es')}.ts`

    addRecording({
      id: String(ts),
      name,
      titulo,
      duration,
      size: blob.size,
      blobUrl: url,
      createdAt: ts,
    })

    recChunksRef.current = []
    alert(`Grabación guardada: ${name}`)
  }, [titulo, addRecording])

  const formatRecTime = (s) => {
    const m = String(Math.floor(s / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    return `${m}:${sec}`
  }

  if (!state) {
    navigate('/')
    return null
  }

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className={styles.toolbarTitle}>{titulo}</span>
        {isLive && (
          <span className={styles.livePill}>
            <span className={styles.liveDot} />
            EN VIVO
          </span>
        )}
      </div>

      {/* Player */}
      <div
        className={styles.playerWrap}
        onClick={() => { togglePlay(); resetControlTimer() }}
        onMouseMove={resetControlTimer}
        onTouchStart={resetControlTimer}
      >
        <video
          ref={videoRef}
          className={styles.video}
          playsInline
          controls={false}
        />

        {/* Buffering */}
        {isBuffering && !error && (
          <div className={styles.buffering}>
            <div className={styles.spinner} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={styles.errorOverlay}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>{error}</p>
          </div>
        )}

        {/* Play/pause overlay */}
        {showControls && !error && (
          <div className={styles.playOverlay}>
            {!isPlaying && (
              <div className={styles.playIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className={styles.controls}>
        {/* Record */}
        <button
          className={`${styles.ctrlBtn} ${isRecording ? styles.ctrlBtnRec : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isRecording ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="8"/>
          </svg>
          <span>{isRecording ? `● ${formatRecTime(recTime)}` : 'Grabar'}</span>
        </button>

        {/* Quality */}
        <div className={styles.qualityWrap}>
          <button
            className={styles.ctrlBtn}
            onClick={() => setShowQuality(p => !p)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span>{QUALITIES[activeQuality].label}</span>
          </button>
          {showQuality && (
            <div className={styles.qualitySheet}>
              {QUALITIES.map((q, i) => (
                <button
                  key={i}
                  className={`${styles.qualityOpt} ${activeQuality === i ? styles.qualityOptActive : ''}`}
                  onClick={() => applyQuality(i)}
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fullscreen */}
        <button
          className={styles.ctrlBtn}
          onClick={() => videoRef.current?.requestFullscreen?.()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
          <span>Pantalla</span>
        </button>
      </div>

      {/* Stream URL info */}
      <div className={styles.urlInfo}>
        <span className={styles.urlLabel}>Stream</span>
        <span className={styles.urlText}>{streamUrl}</span>
      </div>
    </div>
  )
}
