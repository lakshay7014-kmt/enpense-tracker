function Support() {
  var email = 'lakshay7014@gmail.com';
  return (
    <div style={{padding:'1rem',color:'#fff'}}>
      <h2 style={{color:'#e2e8f0'}}>Support</h2>
      <p style={{color:'#94a3b8'}}>Having trouble? We are here to help!</p>
      <div style={{background:'#1e293b',padding:'1.5rem',borderRadius:'12px',marginBottom:'1rem'}}>
        <h3 style={{color:'#e2e8f0',marginBottom:'0.75rem'}}>Contact Us</h3>
        <p style={{color:'#94a3b8',marginBottom:'1rem'}}>Send your issue and we will get back to you soon.</p>
        <a href={'mailto:'+email} style={{padding:'0.75rem 1.5rem',background:'#6366f1',color:'#fff',borderRadius:'8px',textDecoration:'none',fontWeight:'600'}}>
          {email}
        </a>
      </div>
      <div style={{background:'#1e293b',padding:'1.5rem',borderRadius:'12px'}}>
        <h3 style={{color:'#e2e8f0',marginBottom:'1rem'}}>Common Issues</h3>
        <div style={{background:'#0f172a',padding:'0.75rem',borderRadius:'8px',marginBottom:'0.75rem'}}>
          <p style={{color:'#e2e8f0',fontWeight:'600',fontSize:'14px'}}>Q: Cannot login?</p>
          <p style={{color:'#94a3b8',fontSize:'13px',margin:0}}>A: Make sure your email and password are correct.</p>
        </div>
        <div style={{background:'#0f172a',padding:'0.75rem',borderRadius:'8px',marginBottom:'0.75rem'}}>
          <p style={{color:'#e2e8f0',fontWeight:'600',fontSize:'14px'}}>Q: Transaction not saving?</p>
          <p style={{color:'#94a3b8',fontSize:'13px',margin:0}}>A: Check your internet connection and try again.</p>
        </div>
        <div style={{background:'#0f172a',padding:'0.75rem',borderRadius:'8px',marginBottom:'0.75rem'}}>
          <p style={{color:'#e2e8f0',fontWeight:'600',fontSize:'14px'}}>Q: Charts not showing?</p>
          <p style={{color:'#94a3b8',fontSize:'13px',margin:0}}>A: Add at least one transaction first.</p>
        </div>
        <div style={{background:'#0f172a',padding:'0.75rem',borderRadius:'8px'}}>
          <p style={{color:'#e2e8f0',fontWeight:'600',fontSize:'14px'}}>Q: Bill not updating?</p>
          <p style={{color:'#94a3b8',fontSize:'13px',margin:0}}>A: Refresh the page and try again.</p>
        </div>
      </div>
    </div>
  );
}
export default Support;