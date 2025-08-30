import { Routes, Route } from 'react-router-dom'
import { DuoFinderPage } from './pages/DuoFinderPage'
import { ProfilePage } from './pages/ProfilePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<DuoFinderPage />} />
      <Route path="/profile/:region/:riotId/:tag" element={<ProfilePage />} />
    </Routes>
  )
}

export default App;