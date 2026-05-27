import { useState, useEffect } from 'react'

const STORAGE_KEY = 'videx_recordings'

export function useRecordings() {
  const [recordings, setRecordings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch { return [] }
  })

  const save = (list) => {
    setRecordings(list)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }

  const addRecording = (rec) => save([rec, ...recordings])

  const deleteRecording = (id) => save(recordings.filter(r => r.id !== id))

  const clearAll = () => save([])

  return { recordings, addRecording, deleteRecording, clearAll }
}
