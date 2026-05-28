import Link from 'next/link'

const TECHS = [
  {id:'1',name:'Ade Kosoko',trade:'Electrician',rating:4.9,jobs:83,rate:3500,tier:'certified',available:true},
  {id:'2',name:'Bisi Nwosu',trade:'Plumber',rating:4.7,jobs:61,rate:4000,tier:'certified',available:true},
  {id:'3',name:'Funke Okafor',trade:'AC & Cooling',rating:4.8,jobs:47,rate:5000,tier:'certified',available:false},
  {id:'4',name:'Tunde Iheji',trade:'Carpenter',rating:4.6,jobs:39,rate:2500,tier:'standard',available:true},
  {id:'5',name:'Chidi Eze',trade:'Painter',rating:4.5,jobs:28,rate:2000,tier:'certified',available:true},
  {id:'6',name:'Kola Adegoke',trade:'Mason',rating:4.3,jobs:22,rate:3000,tier:'standard',available:false},
]

export default function FindPage() {
  return (
    <div style={{fontFamily:'sans-serif',maxWidth:'800px',margin:'0 auto',padding:'40px 24px'}}>
      <Link href="/" style={{color:'#0F6E56',fontSize:'14px',fontWeight:'600'}}>← Home</Link>
      <h1 style={{fontSize:'36px',fontWeight:'900',margin:'16px 0 6px'}}>Find a technician</h1>
      <p style={{color:'#888',marginBottom:'32px',fontSize:'14px'}}>All KYC-verified. All rated. All trackable.</p>
      <div style={{display:'grid',gap:'14px'}}>
        {TECHS.map(t => (
          <div key={t.id} style={{background:'white',border:'1px solid #eee',borderRadius:'16px',padding:'20px',display:'flex',alignItems:'center',gap:'16px'}}>
            <div style={{width:'52px',height:'52px',borderRadius:'50%',background:t.tier==='certified'?'#E1F5EE':'#f0f0f0',color:t.tier==='certified'?'#0F6E56':'#666',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'800',fontSize:'16px',flexShrink:0}}>
              {t.name.split(' ').map(n=>n[0]).join('')}
            </div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px',flexWrap:'wrap'}}>
                <span style={{fontWeight:'700',fontSize:'16px'}}>{t.name}</span>
                {t.tier==='certified' && <span style={{background:'#E1F5EE',color:'#0F6E56',fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'100px'}}>✓ Certified</span>}
                <span style={{background:t.available?'#E1F5EE':'#fff8e1',color:t.available?'#0F6E56':'#D97706',fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'100px'}}>
                  {t.available?'Available':'Busy'}
                </span>
              </div>
              <div style={{color:'#888',fontSize:'13px'}}>{t.trade} · ★ {t.rating} · {t.jobs} jobs</div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{color:'#0F6E56',fontWeight:'700',fontSize:'16px',marginBottom:'8px'}}>₦{t.rate.toLocaleString()}/hr</div>
              <Link href={`/profile/${t.id}`} style={{background:'#0F6E56',color:'white',padding:'8px 18px',borderRadius:'8px',fontSize:'13px',fontWeight:'600'}}>
                View profile
              </Link>
            </div>
          </div>
        ))}
      </div>
      <div style={{marginTop:'32px',textAlign:'center'}}>
        <Link href="/jobs/post" style={{background:'#E1F5EE',color:'#0F6E56',padding:'14px 28px',borderRadius:'12px',fontWeight:'700',fontSize:'15px'}}>
          Can't find what you need? Post a job →
        </Link>
      </div>
    </div>
  )
}
