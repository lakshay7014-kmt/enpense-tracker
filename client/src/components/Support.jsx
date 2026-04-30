export default function Support() {
  const faqs = [
    { q: 'Cannot login?', a: 'Make sure your email and password are correct.' },
    { q: 'Transaction not saving?', a: 'Check your internet connection and try again.' },
    { q: 'Charts not showing?', a: 'Add at least one transaction first.' },
    { q: 'Bill not updating?', a: 'Refresh the page and try again.' },
  ];

  return (
    <div style={{ padding: '1rem', color: '#fff', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: '#e2e8f0', marginBottom: '0.5rem' }}>Support</h2>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
        Having trouble? We are here to help!
      </p>

      <div style={card}>
        <h3 style={{ color: '#e2e8f0', marginBottom: '0.75rem' }}>Contact Us</h3>
        <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
          Send us your issue and we will get back to you as soon as possible.
        </p>
        
          href="mailto:lakshay7014@gmail.com?subject=Expense Tracker Support"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: '#6366f1',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          Email: lakshay7014@gmail.com
        </a>
      </div>

      <div style={{ ...card, marginTop: '1rem' }}>
        <h3 style={{ color: '#e2e8f0', marginBottom: '1rem' }}>Common Issues</h3>
        {faqs.map((item, i) => (
          <div key={i} style={{
            marginBottom: '0.75rem',
            padding: '0.75rem',
            background: '#0f172a',
            borderRadius: '8px'
          }}>
            <p style={{ color: '#e2e8f0', fontWeight: '600', marginBottom: '0.25rem', fontSize: '14px' }}>
              Q: {item.q}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
              A: {item.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const card = {
  background: '#1e293b',
  padding: '1.5rem',
  borderRadius: '12px'
};