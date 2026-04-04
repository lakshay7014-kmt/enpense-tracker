import { useState, useEffect } from 'react';
import { getTransactions, addTransaction, deleteTransaction, categorizeAI, getInsights } from '../../services/api';
import BillScheduler from '../bills/BillScheduler';
import BudgetManager from '../budget/BudgetManager';
import SpendingCharts from '../charts/SpendingCharts';

export default function Dashboard({ user, onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [form, setForm] = useState({ description: '', amount: '', type: 'expense', category: '' });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async () => {
    try {
      const res = await getTransactions();
      setTransactions(res.data.transactions);
    } catch (err) { console.log(err); }
  };

  const handleAICategory = async () => {
    if (!form.description) return;
    setAiLoading(true);
    try {
      const res = await categorizeAI(form.description);
      setForm({ ...form, category: res.data.category });
    } catch (err) { console.log(err); }
    setAiLoading(false);
  };

  const handleAdd = async () => {
    if (!form.description || !form.amount) return;
    setLoading(true);
    try {
      await addTransaction(form);
      setForm({ description: '', amount: '', type: 'expense', category: '' });
      fetchTransactions();
    } catch (err) { console.log(err); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await deleteTransaction(id);
    fetchTransactions();
  };

  const handleInsights = async () => {
    if (transactions.length === 0) return;
    try {
      const res = await getInsights(transactions);
      setInsights(res.data);
    } catch (err) { console.log(err); }
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const tabLabels = {
    dashboard: '📊 Dashboard',
    bills: '🗓️ Bills',
    budget: '💰 Budget',
    charts: '📈 Charts'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '2rem', color: '#fff' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#fff', margin: 0 }}>💰 Expense Tracker</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#94a3b8' }}>👋 {user.name}</span>
          <button onClick={onLogout} style={{ ...smallBtn, background: '#ef4444' }}>Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {['dashboard', 'bills', 'budget', 'charts'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1.25rem',
              background: activeTab === tab ? '#6366f1' : '#1e293b',
              color: '#fff', border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontWeight: activeTab === tab ? '600' : '400'
            }}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {activeTab === 'bills' && <BillScheduler />}
      {activeTab === 'budget' && <BudgetManager />}
      {activeTab === 'charts' && <SpendingCharts />}

      {activeTab === 'dashboard' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            <div style={card}>
              <p style={cardLabel}>Total Income</p>
              <p style={{ ...cardValue, color: '#4ade80' }}>₹{totalIncome.toLocaleString()}</p>
            </div>
            <div style={card}>
              <p style={cardLabel}>Total Expense</p>
              <p style={{ ...cardValue, color: '#f87171' }}>₹{totalExpense.toLocaleString()}</p>
            </div>
            <div style={card}>
              <p style={cardLabel}>Balance</p>
              <p style={{ ...cardValue, color: balance >= 0 ? '#4ade80' : '#f87171' }}>
                ₹{balance.toLocaleString()}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={card}>
              <h3 style={{ marginBottom: '1rem', color: '#e2e8f0' }}>➕ Transaction Add karo</h3>
              <input
                placeholder="Description (e.g. Zomato se khana)"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                style={inputStyle}
              />
              <button onClick={handleAICategory} style={{ ...smallBtn, marginBottom: '0.75rem', width: '100%' }}>
                {aiLoading ? 'Detect ho raha hai...' : '🤖 AI se Category Detect karo'}
              </button>
              <input
                placeholder="Amount (₹)"
                type="number"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                style={inputStyle}
              />
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                style={inputStyle}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input
                placeholder="Category"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                style={inputStyle}
              />
              <button onClick={handleAdd} disabled={loading} style={btnStyle}>
                {loading ? 'Add ho raha hai...' : 'Transaction Add karo'}
              </button>
            </div>

            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: '#e2e8f0', margin: 0 }}>📋 Transactions ({transactions.length})</h3>
                <button onClick={handleInsights} style={smallBtn}>🤖 AI Insights</button>
              </div>
              {transactions.length === 0 && (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                  Koi transaction nahi hai abhi
                </p>
              )}
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {transactions.map(t => (
                  <div key={t.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.75rem', background: '#0f172a', borderRadius: '8px', marginBottom: '0.5rem'
                  }}>
                    <div>
                      <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px' }}>{t.description}</p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{t.category}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: t.type === 'income' ? '#4ade80' : '#f87171', fontWeight: '600' }}>
                        {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleDelete(t.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}
                      >🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {insights && (
            <div style={{ ...card, marginTop: '1.5rem' }}>
              <h3 style={{ color: '#e2e8f0', marginBottom: '1rem' }}>🤖 AI Insights</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
                  <p style={cardLabel}>Savings Rate</p>
                  <p style={{ ...cardValue, color: '#818cf8' }}>{insights.savingsRate}</p>
                </div>
                <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
                  <p style={cardLabel}>Total Income</p>
                  <p style={{ ...cardValue, color: '#4ade80' }}>₹{insights.totalIncome?.toLocaleString()}</p>
                </div>
                <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
                  <p style={cardLabel}>Total Expense</p>
                  <p style={{ ...cardValue, color: '#f87171' }}>₹{insights.totalExpense?.toLocaleString()}</p>
                </div>
              </div>
              <div>
                {insights.suggestions?.map((s, i) => (
                  <p key={i} style={{ color: '#e2e8f0', padding: '0.5rem', background: '#0f172a', borderRadius: '6px', marginBottom: '0.5rem' }}>{s}</p>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const card = { background: '#1e293b', padding: '1.5rem', borderRadius: '12px' };
const cardLabel = { color: '#94a3b8', fontSize: '13px', margin: '0 0 0.25rem' };
const cardValue = { fontSize: '24px', fontWeight: '700', margin: 0 };
const inputStyle = { width: '100%', padding: '0.6rem 1rem', marginBottom: '0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' };
const btnStyle = { width: '100%', padding: '0.75rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: '600' };
const smallBtn = { padding: '0.4rem 0.75rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' };