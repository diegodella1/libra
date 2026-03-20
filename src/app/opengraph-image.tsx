import { ImageResponse } from 'next/og'

export const alt = 'Archivo Libra — Documentos judiciales del criptoescándalo presidencial'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a1a22',
          position: 'relative',
        }}
      >
        {/* Gold line top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: '#facc15',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontFamily: 'monospace',
              color: '#facc15',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            Investigacion periodistica
          </span>

          <span
            style={{
              fontSize: 72,
              fontFamily: 'Georgia, serif',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.1,
            }}
          >
            Archivo{' '}
            <span style={{ color: '#facc15' }}>Libra</span>
          </span>

          {/* Gold separator */}
          <div
            style={{
              width: 80,
              height: 2,
              background: '#facc15',
              marginTop: 8,
              marginBottom: 8,
            }}
          />

          <span
            style={{
              fontSize: 22,
              fontFamily: 'Georgia, serif',
              color: '#8a8ba5',
              maxWidth: 600,
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            Documentos judiciales del criptoescándalo presidencial
          </span>
        </div>

        {/* Gold line bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: '#facc15',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
