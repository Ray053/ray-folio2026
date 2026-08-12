'use client'
import { useState, useCallback } from 'react'
import { startPose, stopPose } from '@/lib/poseTracking'

export function WebcamToggle({
  active,
  onChange,
}: {
  active: boolean
  onChange: (v: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(false)

  const toggle = useCallback(async () => {
    setError(false)
    if (active) {
      stopPose()
      onChange(false)
      return
    }
    setLoading(true)
    try {
      await startPose()
      onChange(true)
    } catch (e) {
      console.error('Webcam / pose start failed:', e)
      setError(true)
      stopPose()
      onChange(false)
    } finally {
      setLoading(false)
    }
  }, [active, onChange])

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-pressed={active}
      className="glass-pill"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        color: 'var(--color-text-primary)',
        fontSize: '13px',
        fontWeight: 500,
        cursor: loading ? 'wait' : 'pointer',
        transition: 'transform 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Status dot */}
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '9999px',
        backgroundColor: active ? '#0A84FF' : 'var(--color-text-muted)',
        boxShadow: active ? '0 0 8px 2px rgba(10,132,255,0.7)' : 'none',
        transition: 'all 0.2s',
        flexShrink: 0,
      }} />

      {loading ? 'Loading…' : error ? 'Camera blocked' : active ? 'Embodied' : 'Embody me'}

      {/* Camera icon */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
        {active ? (
          <>
            <path d="M23 7l-7 5 7 5V7z"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </>
        ) : (
          <>
            <path d="M1 1l22 22"/>
            <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m4-2h4l2 2h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a3 3 0 1 1-4.24-4.24"/>
          </>
        )}
      </svg>
    </button>
  )
}
