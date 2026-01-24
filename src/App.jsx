import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { ChatLayout } from '@/components/chat/chat-layout'
import { ChatWelcome } from '@/components/chat/chat-welcome'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <ChatLayout>
          <Routes>
            <Route path="/" element={<ChatWelcome />} />
          </Routes>
        </ChatLayout>
      </Router>
    </ThemeProvider>
  )
}

export default App

