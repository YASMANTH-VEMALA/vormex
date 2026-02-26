import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Vormex – Professional Social Networking for Students';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.vormex.in');
  const logoUrl = `${baseUrl}/logo.png`;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #171717 100%)',
        }}
      >
        <img
          src={logoUrl}
          alt="Vormex"
          width={280}
          height={280}
          style={{ marginBottom: 24 }}
        />
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-0.02em',
          }}
        >
          Vormex
        </div>
        <div
          style={{
            fontSize: 24,
            color: '#a3a3a3',
            marginTop: 8,
          }}
        >
          India&apos;s Professional Social Network for Students
        </div>
      </div>
    ),
    { ...size }
  );
}
