'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isChunkError =
    error.name === 'ChunkLoadError' ||
    error.message?.includes('Loading chunk') ||
    error.message?.includes('Failed to fetch dynamically imported module')

  useEffect(() => {
    if (isChunkError) {
      try {
        const key = 'chunk-error-reload'
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1')
          window.location.reload()
          return
        }
      } catch {
        // Storage unavailable — skip auto-reload, show fallback UI
      }
    }
  }, [error, isChunkError])

  const message = isChunkError
    ? 'A new version may have been deployed. Try reloading the page.'
    : 'An unexpected error occurred. Try reloading or come back later.'

  return (
    <html lang="en">
      <body
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#030712',
          color: '#f3f4f6',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          margin: 0,
        }}
      >
        <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>
            Something went wrong
          </h2>
          <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>
            {message}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                borderRadius: '0.375rem',
                backgroundColor: '#2563eb',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Reload page
            </button>
            <button
              onClick={reset}
              style={{
                borderRadius: '0.375rem',
                border: '1px solid #374151',
                backgroundColor: 'transparent',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#d1d5db',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
