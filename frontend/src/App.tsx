import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import { LandingPage } from './pages/LandingPage'
import { VoiceRoom } from './pages/VoiceRoom'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/room" element={<VoiceRoom />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
