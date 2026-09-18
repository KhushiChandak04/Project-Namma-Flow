import { useState } from 'react'
import AppShell from './components/layout/AppShell.jsx'
import ModeToggle from './components/common/ModeToggle.jsx'
import GridPage from './pages/GridPage.jsx'
import CompassPage from './pages/CompassPage.jsx'

const MODES = {
  GRID: 'grid',
  COMPASS: 'compass',
}

export default function App() {
  const [mode, setMode] = useState(MODES.GRID)

  return (
    <AppShell
      mode={mode}
      toggle={<ModeToggle mode={mode} onChange={setMode} />}
    >
      {mode === MODES.GRID ? <GridPage /> : <CompassPage />}
    </AppShell>
  )
}
