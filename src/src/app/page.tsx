import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '80px auto', padding: '0 24px' }}>
      <h1 style={{ color: '#0F6E56', fontSize: '48px', fontWeight: '900', marginBottom: '8px' }}>
        SkillBridge
      </h1>
      <p style={{ color: '#666', fontSize: '18px', marginBottom: '32px' }}>
        Find verified electricians, plumbers, AC technicians and more — near you in Nigeria.
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link href="/find" style={{ background: '#0F6E56', color: 'white', padding: '12px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: '600' }}>
          Find a technician
        </Link>
        <Link href="/jobs" style={{ background: '#E1F5EE', color: '#0F6E56', padding: '12px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: '600' }}>
          Browse jobs
        </Link>
        <Link href="/auth/register" style={{ border: '1px solid #ddd', padding: '12px 24px', borderRadius: '10px', textDecoration: 'none', color: '#333', fontWeight: '600' }}>
          Create account
        </Link>
      </div>
    </div>
  )
}
