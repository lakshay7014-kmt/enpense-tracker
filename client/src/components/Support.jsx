import { useState } from 'react';
import emailjs from '@emailjs/browser';

function Support() {
  var [form, setForm] = useState({ name: '', email: '', message: '' });
  var [status, setStatus] = useState('');
  var [loading, setLoading] = useState(false);

  function handleSend() {
    if (!form.name || !form.email || !form.message) {
      setStatus('error');
      return;
    }
    setLoading(true);
    setStatus('');

    emailjs.send(
      'service_cb3c932',
      'template_rjrop8a',
      {
        from_name: form.name,
        from_email: form.email,
        message: form.message
      },
      'FyatwLsU0bAbD-cPM'
    ).then(function() {
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
      setLoading(false);
    }).catch(function() {
      setStatus('failed');
      setLoading(false);
    });
  }

  var cardStyle = {
    background: '#1e293b',
    padding: '1.5rem',
    borderRadius: '12px',
    marginBottom: '1rem'
  };

  var inputStyle = {
    width: '100%',
    padding: '0.6rem 1rem',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box',
    marginBottom: '0.75rem'
  };

  var btnStyle = {
    width: '100%',
    padding: '0.75rem',
    background: loading ? '#4f46e5' : '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontWeight: '600'
  };

  var faqs = [
    { q: 'Cannot login?', a: 'Make sure your email and password are correct.' },
    { q: 'Transaction not saving?', a: 'Check your internet connection and try again.' },
    { q: 'Charts not showing?', a: 'Add at least one transaction first.' },
    { q: 'Bill not updating?', a: 'Refresh the page and try again.' },
  ];

  return (
    <div style={{ padding: '0.5rem', color: '#fff', maxWidth: '600px', margin: '0 auto' }}>

      <h2 style={{ color: '#e2e8f0', marginBottom: '0.5rem', fontSize: 'clamp(18px, 4vw, 24px)' }}>
        Support
      </h2>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
        Having trouble? Send us your problem directly!
      </p>

      <div style={cardStyle}>
        <h3 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: 'clamp(14px, 3vw, 18px)' }}>
          Contact Us
        </h3>

        <input
          placeholder="Your Name"
          value={form.name}
          onChange={function(e) { setForm({ ...form, name: e.target.value }); }}
          style={inputStyle}
        />

        <input
          placeholder="Your Email"
          type="email"
          value={form.email}
          onChange={function(e) { setForm({ ...form, email: e.target.value }); }}
          style={inputStyle}
        />

        <textarea
          placeholder="Describe your problem here..."
          value={form.message}
          onChange={function(e) { setForm({ ...form, message: e.target.value }); }}
          rows={5}
          style={{ ...inputStyle, resize: 'vertical' }}
        />

        {status === 'error' && (
          <p style={{ color: '#f87171', marginBottom: '0.75rem', fontSize: '13px' }}>
            Please fill all fields before sending.
          </p>
        )}

        {status === 'success' && (
          <p style={{ color: '#4ade80', marginBottom: '0.75rem', fontSize: '13px' }}>
            Message sent successfully! We will get back to you soon.
          </p>
        )}

        {status === 'failed' && (
          <p style={{ color: '#f87171', marginBottom: '0.75rem', fontSize: '13px' }}>
            Something went wrong. Please try again.
          </p>
        )}

        <button onClick={handleSend} disabled={loading} style={btnStyle}>
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </div>

      <div style={cardStyle}>
        <h3 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: 'clamp(14px, 3vw, 18px)' }}>
          Common Issues
        </h3>
        {faqs.map(function(item, i) {
          return (
            <div key={i} style={{ marginBottom: '0.75rem', padding: '0.75rem', background: '#0f172a', borderRadius: '8px' }}>
              <p style={{ color: '#e2e8f0', fontWeight: '600', marginBottom: '0.25rem', fontSize: '14px' }}>
                Q: {item.q}
              </p>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                A: {item.a}
              </p>
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default Support;