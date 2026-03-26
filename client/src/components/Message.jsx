import { useState } from 'react'

export default function Message({ message }) {
  const [showSources, setShowSources] = useState(false)
  const isUser = message.role === 'user'

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      flexDirection: isUser ? 'row-reverse' : 'row'
    }}>
      {/* Avatar */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '10px',
        background: isUser ? 'var(--surface2)' : 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px', flexShrink: 0,
        border: '1px solid var(--border)'
      }}>
        {isUser ? '👤' : '🧠'}
      </div>

      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Bubble */}
        <div style={{
          background: isUser ? 'var(--accent)' : 'var(--surface)',
          border: `1px solid ${isUser ? 'transparent' : 'var(--border)'}`,
          borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
          padding: '12px 16px',
          fontSize: '14px',
          lineHeight: '1.6',
          color: isUser ? 'white' : 'var(--text)',
          whiteSpace: 'pre-wrap'
        }}>
          {message.content}
        </div>

        {/* Sources */}
        {!isUser && message.sources?.length > 0 && (
          <div>
            <button
              onClick={() => setShowSources(!showSources)}
              style={{
                background: 'none', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer',
                fontSize: '11px', fontFamily: 'JetBrains Mono',
                padding: '4px 0', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              {showSources ? '▼' : '▶'} {message.sources.length} source{message.sources.length > 1 ? 's' : ''}
            </button>

            {showSources && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                {message.sources.map((source, i) => (
                  <div key={i} style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    borderLeft: '3px solid var(--accent)'
                  }}>
                    <div style={{
                      fontSize: '11px', fontWeight: 600,
                      color: 'var(--accent2)', fontFamily: 'JetBrains Mono',
                      marginBottom: '4px', display: 'flex', justifyContent: 'space-between'
                    }}>
                      <span>📄 {source.filename}</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {Math.round(source.score * 100)}% match
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      {source.preview}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}