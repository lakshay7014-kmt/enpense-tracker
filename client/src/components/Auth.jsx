import { useState } from 'react';
import { login, register } from '../services/api';

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = isLogin
        ? await login({ email: form.email, password: form.password })
        : await register(form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Kuch galat hua');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0f172a'
    }}>
      <div style={{
        background: '#1e293b', padding: '2rem', borderRadius: '16px',
        width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>
        <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: '0.5rem' }}>
          💰 Expense Tracker
        </h1>
        <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '2rem' }}>
          {isLogin ? 'Login karo' : 'Account banao'}
        </p>

        {!isLogin && (
          <input
            placeholder="Aapka naam"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            style={inputStyle}
          />
        )}
        <input
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          style={inputStyle}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          style={inputStyle}
        />

        {error && (
          <p style={{ color: '#f87171', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </p>
        )}

        <button onClick={handleSubmit} disabled={loading} style={btnStyle}>
          {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
        </button>

        <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '1rem' }}>
          {isLogin ? 'Account nahi hai? ' : 'Pehle se account hai? '}
          <span
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: '#6366f1', cursor: 'pointer' }}
          >
            {isLogin ? 'Register karo' : 'Login karo'}
          </span>
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '0.75rem 1rem', marginBottom: '1rem',
  background: '#0f172a', border: '1px solid #334155', borderRadius: '8px',
  color: '#fff', fontSize: '14px', boxSizing: 'border-box'
};

const btnStyle = {
  width: '100%', padding: '0.75rem', background: '#6366f1',
  color: '#fff', border: 'none', borderRadius: '8px',
  fontSize: '16px', cursor: 'pointer', fontWeight: '600'
};