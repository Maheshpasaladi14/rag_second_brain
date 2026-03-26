import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import './index.css'

export default function App() {
  const [documents, setDocuments] = useState([])
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey! I'm your Second Brain. Upload some documents and ask me anything about them.",
      sources: []
    }
  ])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <Sidebar documents={documents} setDocuments={setDocuments} />
      <ChatWindow messages={messages} setMessages={setMessages} />
    </div>
  )
}