import Link from 'next/link'

export default function LoginPage() {
  return (
    <div style={{fontFamily:'sans-serif',minHeight:'100vh',background:'#f8f8f6',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
      <div style={{background:'white',borderRadius:'20px',padding:'40px',width:'100%',maxWidth:'380px',border:'1px solid #eee'}}>
        <Link href="/" style={{fontWeight:'900',fontSize:'22px',color:'#0D0D0D',display:'block',marginBottom:'28px'}}>
          <span style={{color:'#0F6E56'}}>Skill</span>Bridge
        </Link>
        <h1 style={{fontSize:'28px',fontWeight:'900',marginBottom:'4px'}}>Welcome back</h1>
        <p style={{color:'#888',fontSize:'14px',marginBottom:'28px'}}>Sign in to your account</p>
        <div style={{marginBottom:'16px'}}>
          <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'#555',marginBottom:'6px'}}>Phone number</label>
          <input type="tel" placeholder="+234 800 000 0000" style={{width:'100%',padding:'12px',border:'1.5px solid #e5e5e5',borderRadius:'10px',fontSize:'14px',outline:'none',boxSizing:'border-box'}} />
        </div>
        <div style={{marginBottom:'28px'}}>
          <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'#555',marginBottom:'6px'}}>Password</label>
          <input type="password" placeholder="Enter your password" style={{width:'100%',padding:'12px',border:'1.5px solid #e5e5e5',borderRadius:'10px',fontSize:'14px',outline:'none',boxSizing:'border-box'}} />
        </div>
        <button style={{width:'100%',padding:'14px',background:'#0F6E56',color:'white',border:'none',borderRadius:'10px',fontSize:'15px',fontWeight:'700',cursor:'pointer',marginBottom:'16px'}}>
          Sign in
        </button>
        <p style={{textAlign:'center',fontSize:'14px',color:'#888'}}>
          No account? <Link href="/auth/register" style={{color:'#0F6E56',fontWeight:'700'}}>Create one</Link>
        </p>
      </div>
    </div>
  )
}
