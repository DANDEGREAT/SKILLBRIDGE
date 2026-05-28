import Link from 'next/link'

const JOBS = [
  {id:'1',title:'Generator installation — 20KVA Mikano',trade:'Electrical',location:'Victoria Island, Lagos',budget:'₦85,000',bids:3,urgent:true,posted:'2hr ago'},
  {id:'2',title:'Fix leaking bathroom pipe and replace fittings',trade:'Plumbing',location:'Lekki Phase 1, Lagos',budget:'₦25,000',bids:7,urgent:false,posted:'4hr ago'},
  {id:'3',title:'Install split AC unit — 1.5HP Daikin',trade:'AC & Cooling',location:'Ikeja GRA, Lagos',budget:'₦45,000',bids:2,urgent:false,posted:'5hr ago'},
  {id:'4',title:'Full house rewiring — 4 bedroom duplex',trade:'Electrical',location:'Abuja, FCT',budget:'₦200,000',bids:1,urgent:false,posted:'6hr ago'},
  {id:'5',title:'Build wooden wardrobe — master bedroom',trade:'Carpentry',location:'Surulere, Lagos',budget:'₦60,000',bids:4,urgent:false,posted:'8hr ago'},
]

export default function JobsPage() {
  return (
    <div style={{fontFamily:'sans-serif',maxWidth:'800px',margin:'0 auto',padding:'40px 24px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'24px',flexWrap:'wrap',gap:'12px'}}>
        <div>
          <Link href="/" style={{color:'#0F6E56',fontSize:'14px',fontWeight:'600'}}>← Home</Link>
          <h1 style={{fontSize:'36px',fontWeight:'900',margin:'12px 0 4px'}}>Job Board</h1>
          <p style={{color:'#888',fontSize:'14px'}}>{JOBS.length} open jobs near you</p>
        </div>
        <Link href="/jobs/post" style={{background:'#0F6E56',color:'white',padding:'12px 24px',borderRadius:'10px',fontWeight:'700',fontSize:'14px'}}>
          + Post a job
        </Link>
      </div>
      <div style={{display:'grid',gap:'14px'}}>
        {JOBS.map(j => (
          <div key={j.id} style={{background:'white',border:'1px solid #eee',borderRadius:'16px',padding:'22px'}}>
            <div style={{display:'flex',justifyContent:'space-between',gap:'16px',alignItems:'flex-start'}}>
              <div style={{flex:1}}>
                <div style={{marginBottom:'6px'}}>
                  {j.urgent && <span style={{background:'#FEF2F2',color:'#C0392B',fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'100px',marginRight:'8px',textTransform:'uppercase'}}>Urgent</span>}
                  <span style={{fontWeight:'700',fontSize:'16px'}}>{j.title}</span>
                </div>
                <div style={{color:'#888',fontSize:'13px',display:'flex',gap:'16px',flexWrap:'wrap'}}>
                  <span>🔧 {j.trade}</span>
                  <span>📍 {j.location}</span>
                  <span>🕒 {j.posted}</span>
                </div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{color:'#0F6E56',fontWeight:'800',fontSize:'20px'}}>{j.budget}</div>
                <div style={{color:'#888',fontSize:'12px',marginTop:'2px'}}>{j.bids} bids</div>
              </div>
            </div>
            <div style={{display:'flex',gap:'10px',marginTop:'16px'}}>
              <Link href={`/chat/${j.id}`} style={{background:'#0F6E56',color:'white',padding:'8px 20px',borderRadius:'8px',fontSize:'13px',fontWeight:'600'}}>
                View & Apply
              </Link>
              <button style={{border:'1px solid #eee',background:'white',padding:'8px 16px',borderRadius:'8px',fontSize:'13px',color:'#666',cursor:'pointer'}}>
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
