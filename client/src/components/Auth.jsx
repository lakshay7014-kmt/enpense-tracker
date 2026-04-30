import { useState } from 'react';
import { login, register } from '../services/api';
import emailjs from '@emailjs/browser';

export default function Auth({ onLogin }) {
  var [isLogin, setIsLogin] = useState(true);
  var [form, setForm] = useState({ name: '', email: '', password: '' });
  var [error, setError] = useState('');
  var [loading, setLoading] = useState(false);

  var [showHelp, setShowHelp] = useState(false);
  var [helpForm, setHelpForm] = useState({ name: '', email: '', message: '' });
  var [helpStatus, setHelpStatus] = useState('');
  var [helpLoading, setHelpLoading] = useState(false);

  function handleSubmit() {
    setLoading(true);
    setError('');
    var promise = isLogin
      ? login({ email: form.email, password: form.password })
      : register(form);

    promise.then(function(res) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
    }).catch(function(err) {
      setError(err.response && err.response.data ? err.response.data.message : 'Something went wrong');
    }).finally(function() {
      setLoading(false);
    });
  }

  function handleHelpSend() {
    if (!helpForm.name || !helpForm.email || !helpForm.message) {
      setHelpStatus('error');
      return;
    }
    setHelpLoading(true);
    setHelpStatus('');

    emailjs.send(
      'service_cb3c932',
      'template_rjrop8a',
      {
        from_name: helpForm.name,
        from_email: helpForm.email,
        message: helpForm.message
      },
      'FyatwLsU0bAbD-cPM'
    ).then(function() {
      setHelpStatus('success');
      setHelpForm({ name: '', email: '', message: '' });
      setHelpLoading(false);
    }).catch(function() {
      setHelpStatus('failed');
      setHelpLoading(false);
    });
  }

  var inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box'
  };

  var btnStyle = {
    width: '100%',
    padding: '0.75rem',
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: '600'
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      padding: '1rem'
    }}>
      <div style={{
        background: '#1e293b',
        padding: 'clamp(1.5rem, 5vw, 2rem)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>

        <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: '0.5rem', fontSize: 'clamp(20px, 5vw, 28px)' }}>
          💰 Expense Tracker
        </h1>
        <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '1.5rem', fontSize: '14px' }}>
          {isLogin ? 'Login to your account' : 'Create a new account'}
        </p>

        {!showHelp ? (
          <>
            {!isLogin && (
              <input
                placeholder="Your Name"
                value={form.name}
                onChange={function(e) { setForm({ ...form, name: e.target.value }); }}
                style={inputStyle}
              />
            )}
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={function(e) { setForm({ ...form, email: e.target.value }); }}
              style={inputStyle}
            />
            <input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={function(e) { setForm({ ...form, password: e.target.value }); }}
              style={inputStyle}
            />

            {error && (
              <p style={{ color: '#f87171', marginBottom: '1rem', textAlign: 'center', fontSize: '13px' }}>
                {error}
              </p>
            )}

            <button onClick={handleSubmit} disabled={loading} style={btnStyle}>
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
            </button>

            <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '1rem', fontSize: '13px' }}>
              {isLogin ? 'No account? ' : 'Already have account? '}
              <span
                onClick={function() { setIsLogin(!isLogin); }}
                style={{ color: '#6366f1', cursor: 'pointer', fontWeight: '600' }}
              >
                {isLogin ? 'Register' : 'Login'}
              </span>
            </p>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                onClick={function() { setShowHelp(true); setHelpStatus(''); }}
                style={{
                  background: 'none',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                🆘 Need Help?
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 style={{ color: '#e2e8f0', marginBottom: '0.5rem', fontSize: 'clamp(14px, 3vw, 18px)' }}>
              Need Help?
            </h3>
            <p style={{ color: '#94a3b8', marginBottom: '1rem', fontSize: '13px' }}>
              Describe your problem and we will get back to you soon.
            </p>

            <input
              placeholder="Your Name"
              value={helpForm.name}
              onChange={function(e) { setHelpForm({ ...helpForm, name: e.target.value }); }}
              style={inputStyle}
            />
            <input
              placeholder="Your Email"
              type="email"
              value={helpForm.email}
              onChange={function(e) { setHelpForm({ ...helpForm, email: e.target.value }); }}
              style={inputStyle}
            />
            <textarea
              placeholder="Describe your problem..."
              value={helpForm.message}
              onChange={function(e) { setHelpForm({ ...helpForm, message: e.target.value }); }}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />

            {helpStatus === 'error' && (
              <p style={{ color: '#f87171', marginBottom: '0.75rem', fontSize: '13px' }}>
                Please fill all fields.
              </p>
            )}
            {helpStatus === 'success' && (
              <p style={{ color: '#4ade80', marginBottom: '0.75rem', fontSize: '13px' }}>
                Message sent! We will get back to you soon.
              </p>
            )}
            {helpStatus === 'failed' && (
              <p style={{ color: '#f87171', marginBottom: '0.75rem', fontSize: '13px' }}>
                Something went wrong. Please try again.
              </p>
            )}

            <button
              onClick={handleHelpSend}
              disabled={helpLoading}
              style={{ ...btnStyle, marginBottom: '0.75rem' }}
            >
              {helpLoading ? 'Sending...' : 'Send Message'}
            </button>

            <button
              onClick={function() { setShowHelp(false); setHelpStatus(''); }}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#334155',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}