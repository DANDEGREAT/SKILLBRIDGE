import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{fontFamily:'sans-serif',maxWidth:'680px',margin:'0 auto',padding:'60px 24px'}}>

      <div style={{marginBottom:'8px',fontSize:'11px',fontWeight:'700',color:'#0F6E56',letterSpacing:'3px',textTransform:'uppercase'}}>
        Nigeria's trusted trades platform
      </div>

      <h1 style={{fontSize:'clamp(36px,6vw,60px)',fontWeight:'900',lineHeight:'1.05',letterSpacing:'-2px',color:'#0D0D0D',marginBottom:'20px'}}>
        You always know{' '}
        <span style={{color:'#0F6E56'}}>who's coming</span>{' '}
        to your home.
      </h1>

      <p style={{fontSize:'18px',color:'#555',lineHeight:'1.7',marginBottom:'36px',maxWidth:'520px'}}>
        Find verified, rated electricians, plumbers, AC technicians and more — near you, right now. Live tracking. Money protected in escrow. Every job covered.
      </p>

      <div style={{display:'flex',gap:'12px',flexWrap:'wrap',marginBottom:'64px'}}>
        <Link href="/find" style={{background:'#0F6E56',color:'white',padding:'14px 28px',borderRadius:'12px',fontWeight:'700',fontSize:'15px'}}>
          Find a technician
        </Link>
        <Link href="/jobs" style={{background:'#E1F5EE',color:'#0F6E56',padding:'14px 28px',borderRadius:'12px',fontWeight:'700',fontSize:'15px'}}>
          Browse jobs
        </Link>
        <Link href="/auth/register" style={{border:'1.5px solid #ddd',color:'#333',padding:'14px 28px',borderRadius:'12px',fontWeight:'700',fontSize:'15px'}}>
          Create account
        </Link>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:'16px',marginBottom:'48px'}}>
        {[['5,000+','Verified techs'],['25,000+','Jobs done'],['4.8★','Avg rating'],['₦0','Fraud recorded']].map(([v,l]) => (
          <div key={l} style={{background:'#0F6E56',borderRadius:'14px',padding:'20px',textAlign:'center',color:'white'}}>
            <div style={{fontSize:'26px',fontWeight:'900',marginBottom:'4px'}}>{v}</div>
            <div style={{fontSize:'12px',opacity:'0.8'}}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'14px',marginBottom:'48px'}}>
        {[
          ['🛡️','KYC Verified','Every technician is identity-verified before their first job.'],
          ['📍','Live Tracking','Track your technician in real time from the moment they leave.'],
          ['🔒','Escrow Payments','Your money is held securely and released only when the job is done.'],
          ['⭐','Rated & Reviewed','Real ratings from real clients after every completed job.'],
          ['⚖️','Dispute Cover','Admin-mediated resolution for any job that goes wrong.'],
          ['✅','Certified Pros','Top-tier certified technicians for high-value jobs.'],
        ].map(([icon,title,desc]) => (
          <div key={title as string} style={{background:'white',border:'1px solid #eee',borderRadius:'14px',padding:'20px'}}>
            <div style={{fontSize:'28px',marginBottom:'10px'}}>{icon}</div>
            <div style={{fontWeight:'700',fontSize:'14px',marginBottom:'4px'}}>{title as string}</div>
            <div style={{fontSize:'13px',color:'#666',lineHeight:'1.5'}}>{desc as string}</div>
          </div>
        ))}
      </div>

      <div style={{background:'#0F6E56',borderRadius:'20px',padding:'40px',textAlign:'center',color:'white'}}>
        <h2 style={{fontSize:'28px',fontWeight:'900',marginBottom:'12px'}}>Ready to find a verified pro?</h2>
        <p style={{opacity:'0.8',marginBottom:'24px'}}>Join thousands of Nigerians who trust SkillBridge.</p>
        <Link href="/find" style={{background:'white',color:'#0F6E56',padding:'14px 32px',borderRadius:'12px',fontWeight:'700',fontSize:'15px'}}>
          Find a technician now
        </Link>
      </div>

    </div>
  )
}
