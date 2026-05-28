import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#0F6E56' }}>SkillBridge</h1>
      <p>Find verified technicians near you in Nigeria.</p>
      <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
        <Link href="/find" style={{ background: '#0F6E56', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none' }}>
          Find a technician
        </Link>
        <Link href="/auth/register" style={{ border: '1px solid #ccc', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none' }}>
          Create account
        </Link>
      </div>
    </div>
  )
}
