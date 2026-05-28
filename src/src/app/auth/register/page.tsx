import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div style={{fontFamily:'sans-serif',minHeight:'100vh',background:'#f8f8f6',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
      <div style={{background:'white',borderRadius:'20px',padding:'40px',width:'100%',maxWidth:'380px',border:'1px solid #eee'}}>
        <Link href="/" style={{fontWeight:'900',fontSize:'22px',color:'#0D0D0D',display:'block',marginBottom:'28px'}}>
          <span style={{color:'#0F6E56'}}>Skill</span>Bridge
        </Link>
        <h1 style={{fontSize:'28px',fontWeight:'900',marginBottom:'4px'}}>Create account</h1>
        <p style={{color:'#888',fontSize:'14px',marginBottom:'24px'}}>Join thousands of Nigerians on SkillBridge</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'14px'}}>
          <div>
            <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'#555',marginBottom:'6px'}}>First name</label>
            <input placeholder="Ade" style={{width:'100%',padding:'12px',border:'1.5px solid #e5e5e5',borderRadius:'10px',fontSize:'14px',outline:'none',boxSizing:'border-box'}} />
          </div>
          <div>
            <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'#555',marginBottom:'6px'}}>Last name</label>
            <input placeholder="Kosoko" style={{width:'100%',padding:'12px',border:'1.5px solid #e5e5e5',borderRadius:'10px',fontSize:'14px',outline:'none',boxSizing:'border-box'}} />
          </div>
        </div>
        <div style={{marginBottom:'14px'}}>
          <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'#555',marginBottom:'6px'}}>Phone number</label>
          <input type="tel" placeholder="+234 800 000 0000" style={{width:'100%',padding:'12px',border:'1.5px solid #e5e5e5',borderRadius:'10px',fontSize:'14px',outline:'none',boxSizing:'border-box'}} />
        </div>
        <div style={{marginBottom:'14px'}}>
          <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'#555',marginBottom:'6px'}}>Password</label>
          <input type="password" placeholder="Min 8 characters" style={{width:'100%',padding:'12px',border:'1.5px solid #e5e5e5',borderRadius:'10px',fontSize:'14px',outline:'none',boxSizing:'border-box'}} />
        </div>
        <div style={{marginBottom:'28px'}}>
          <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'#555',marginBottom:'6px'}}>I am a</label>
          <select style={{width:'100%',padding:'12px',border:'1.5px solid #e5e5e5',borderRadius:'10px',fontSize:'14px',outline:'none',boxSizing:'border-box',color:'#333'}}>
            <option value="client">Client — I need work done</option>
            <option value="technician">Technician — I do the work</option>
            <option value="store_owner">Store owner — I sell materials</option>
          </select>
        </div>
        <button style={{width:'100%',padding:'14px',background:'#0F6E56',color:'white',border:'none',borderRadius:'10px',fontSize:'15px',fontWeight:'700',cursor:'pointer',marginBottom:'16px'}}>
          Create account
        </button>
        <p style={{textAlign:'center',fontSize:'14px',color:'#888'}}>
          Already registered? <Link href="/auth/login" style={{color:'#0F6E56',fontWeight:'700'}}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
