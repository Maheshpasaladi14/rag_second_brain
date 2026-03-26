import { useState, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Sidebar({ documents, setDocuments }) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDocuments()
    const interval = setInterval(fetchDocuments, 5000)
    return () => clearInterval(interval)
  }, [])

  async function fetchDocuments() {
    try {
      const res = await axios.get(`${API}/api/documents`)
      setDocuments(res.data.documents || [])
    } catch {}
  }

  async function handleUpload(file) {
    if (!file) return
    setError('')
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      await axios.post(`${API}/api/upload`, formData)
      setTimeout(fetchDocuments, 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id) {
    try {
      await axios.delete(`${API}/api/documents/${id}`)
      fetchDocuments()
    } catch {}
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const statusColor = (status) => {
    if (status === 'ready') return 'var(--green)'
    if (status === 'failed') return 'var(--red)'
    return 'var(--accent)'
  }

  const statusDot = (status) => {
    if (status === 'processing') return '⟳'
    if (status === 'ready') return '●'
    return '✕'
  }

  return (
    <aside style={{
      width: '280px',
      minWidth: '280px',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      gap: '24px'
    }}>
      {/* Logo */}
      <div>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: '18px',
          letterSpacing: '-0.5px',
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '20px' }}>🧠</span>
          Second Brain
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'JetBrains Mono' }}>
          RAG-powered knowledge base
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => document.getElementById('fileInput').click()}
        style={{
          border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--border-hover)'}`,
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? '#7c6aff10' : 'transparent',
          transition: 'all 0.2s ease'
        }}
      >
        <input
          id="fileInput"
          type="file"
          accept=".pdf,.txt"
          style={{ display: 'none' }}
          onChange={(e) => handleUpload(e.target.files[0])}
        />
        {uploading ? (
          <div style={{ color: 'var(--accent)', fontSize: '13px' }}>Uploading...</div>
        ) : (
          <>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>+</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Drop PDF or TXT here
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
              or click to browse
            </div>
          </>
        )}
      </div>

      {error && (
        <div style={{ fontSize: '12px', color: 'var(--red)', padding: '8px 12px', background: '#f8717115', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* Documents List */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Documents ({documents.length})
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {documents.length === 0 && (
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center', marginTop: '20px' }}>
              No documents yet
            </div>
          )}
          {documents.map(doc => (
            <div key={doc._id} style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'border-color 0.2s'
            }}>
              <span style={{ fontSize: '11px', color: statusColor(doc.status) }}>
                {statusDot(doc.status)}
              </span>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {doc.originalName}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>
                  {doc.totalChunks} chunks · {doc.type.toUpperCase()}
                </div>
              </div>
              <button
                onClick={() => handleDelete(doc._id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  transition: 'color 0.2s'
                }}
                onMouseOver={e => e.target.style.color = 'var(--red)'}
                onMouseOut={e => e.target.style.color = 'var(--text-dim)'}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}