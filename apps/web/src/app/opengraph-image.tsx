import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'EvalCap – Performance Review Journaling'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#a5b4fc',
            marginBottom: 48,
            letterSpacing: '-0.5px',
          }}
        >
          EvalCap
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: '#f8fafc',
            lineHeight: 1.1,
            letterSpacing: '-2px',
            maxWidth: 900,
            marginBottom: 32,
          }}
        >
          Your performance review,{' '}
          <span style={{ color: '#818cf8' }}>already written</span>
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: 28,
            color: '#94a3b8',
            fontWeight: 400,
            maxWidth: 700,
          }}
        >
          Five-minute weekly check-ins. An honest, polished self-review when you need it.
        </div>

        {/* Badge */}
        <div
          style={{
            marginTop: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            borderRadius: 50,
            padding: '10px 24px',
            fontSize: 18,
            color: '#a5b4fc',
            fontWeight: 500,
          }}
        >
          AI-powered · Free to start · No credit card
        </div>
      </div>
    ),
    { ...size }
  )
}
