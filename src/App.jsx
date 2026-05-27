import { Routes, Route, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Player from './pages/Player'
import Recordings from './pages/Recordings'
import Config from './pages/Config'

export default function App() {
  const { pathname } = useLocation()
  const hideNav = pathname === '/player'

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/player" element={<Player />} />
        <Route path="/grabaciones" element={<Recordings />} />
        <Route path="/configuracion" element={<Config />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </>
  )
}
