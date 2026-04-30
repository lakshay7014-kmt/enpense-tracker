import { useState, useEffect } from 'react';
import { getTransactions, addTransaction, deleteTransaction, categorizeAI, getInsights } from '../../services/api';
import BillScheduler from '../bills/BillScheduler';
import BudgetManager from '../budget/BudgetManager';
import SpendingCharts from '../charts/SpendingCharts';
import ImportTransactions from '../transactions/ImportTransactions';
import Support from '../Support';

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

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const tabs = [
    { key: 'dashboard', label: '📊 Dashboard' },
    { key: 'import', label: '📥 Import' },
    { key: 'bills', label: '🗓️ Bills' },
    { key: 'budget', label: '💰 Budget' },
    { key: 'charts', label: '📈 Charts' },
    { key: 'support', label: '🛟 Support' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff' }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 1.5rem', background: '#1e293b',
        borderBottom: '1px solid #334155', position: 'sticky', top: 0, zIndex: 100
      }}>
        <h1 style={{ color: '#fff', margin: 0, fontSize: 'clamp(16px, 4vw, 22px)' }}>
          💰 Expense Tracker
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: '#94a3b8', fontSize: 'clamp(11px, 3vw, 14px)' }}>👋 {user.name}</span>
          <button onClick={onLogout} style={{ ...smallBtn, background: '#ef4444' }}>Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '0.4rem', padding: '0.75rem 1rem',
        overflowX: 'auto', background: '#1e293b',
        borderBottom: '1px solid #334155',
        scrollbarWidth: 'none'
      }}>
        {tabs.map(function(tab) {
          return (
            <button
              key={tab.key}
              onClick={function() { setActiveTab(tab.key); }}
              style={{
                padding: '0.4rem 0.9rem',
                background: activeTab === tab.key ? '#6366f1' : '#0f172a',
                color: '#fff', border: 'none', borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: activeTab === tab.key ? '600' : '400',
                whiteSpace: 'nowrap', fontSize: '13px', flexShrink: 0
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: '1rem' }}>

        {activeTab === 'bills' && <BillScheduler />}
        {activeTab === 'budget' && <BudgetManager />}
        {activeTab === 'charts' && <SpendingCharts />}
        {activeTab === 'support' && <Support />}
        {activeTab === 'import' && <ImportTransactions onImportDone={fetchTransactions} />}

        {activeTab === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '0.75rem', marginBottom: '1rem'
            }}>
              <div style={card}>
                <p style={cardLabel}>Total Income</p>
                <p style={{ ...cardValue, color: '#4ade80' }}>Rs.{totalIncome.toLocaleString()}</p>
              </div>
              <div style={card}>
                <p style={cardLabel}>Total Expense</p>
                <p style={{ ...cardValue, color: '#f87171' }}>Rs.{totalExpense.toLocaleString()}</p>
              </div>
              <div style={card}>
                <p style={cardLabel}>Balance</p>
                <p style={{ ...cardValue, color: balance >= 0 ? '#4ade80' : '#f87171' }}>
                  Rs.{balance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Add Transaction + List */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem'
            }}>
              {/* Add Transaction */}
              <div style={card}>
                <h3 style={{ marginBottom: '1rem', color: '#e2e8f0', fontSize: 'clamp(14px, 3vw, 18px)' }}>
                  Add Transaction
                </h3>
                <input
                  placeholder="Description (e.g. Food at Zomato)"
                  value={form.description}
                  onChange={function(e) { setForm({ ...form, description: e.target.value }); }}
                  style={inputStyle}
                />
                <button
                  onClick={handleAICategory}
                  style={{ ...smallBtn, marginBottom: '0.75rem', width: '100%' }}
                >
                  {aiLoading ? 'Detecting...' : '🤖 Auto Detect Category'}
                </button>
                <input
                  placeholder="Amount (Rs.)"
                  type="number"
                  value={form.amount}
                  onChange={function(e) { setForm({ ...form, amount: e.target.value }); }}
                  style={inputStyle}
                />
                <select
                  value={form.type}
                  onChange={function(e) { setForm({ ...form, type: e.target.value }); }}
                  style={inputStyle}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                <input
                  placeholder="Category"
                  value={form.category}
                  onChange={function(e) { setForm({ ...form, category: e.target.value }); }}
                  style={inputStyle}
                />
                <button onClick={handleAdd} disabled={loading} style={btnStyle}>
                  {loading ? 'Adding...' : 'Add Transaction'}
                </button>
              </div>

              {/* Transactions List */}
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: 'clamp(13px, 3vw, 17px)' }}>
                    Transactions ({transactions.length})
                  </h3>
                  <button onClick={handleInsights} style={smallBtn}>🤖 AI Insights</button>
                </div>

                {transactions.length === 0 && (
                  <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem', fontSize: '14px' }}>
                    No transactions yet
                  </p>
                )}

                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {transactions.map(function(t) {
                    return (
                      <div key={t.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.75rem', background: '#0f172a', borderRadius: '8px', marginBottom: '0.5rem'
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.description}
                          </p>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{t.category}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          <span style={{ color: t.type === 'income' ? '#4ade80' : '#f87171', fontWeight: '600', fontSize: 'clamp(12px, 3vw, 14px)' }}>
                            {t.type === 'income' ? '+' : '-'}Rs.{Number(t.amount).toLocaleString()}
                          </span>
                          <button
                            onClick={function() { handleDelete(t.id); }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AI Insights */}
            {insights && (
              <div style={{ ...card, marginTop: '1rem' }}>
                <h3 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: 'clamp(14px, 3vw, 18px)' }}>
                  🤖 AI Insights
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '0.75rem', marginBottom: '1rem'
                }}>
                  <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
                    <p style={cardLabel}>Savings Rate</p>
                    <p style={{ ...cardValue, color: '#818cf8' }}>{insights.savingsRate}</p>
                  </div>
                  <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
                    <p style={cardLabel}>Income</p>
                    <p style={{ ...cardValue, color: '#4ade80' }}>Rs.{insights.totalIncome && insights.totalIncome.toLocaleString()}</p>
                  </div>
                  <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
                    <p style={cardLabel}>Expense</p>
                    <p style={{ ...cardValue, color: '#f87171' }}>Rs.{insights.totalExpense && insights.totalExpense.toLocaleString()}</p>
                  </div>
                </div>
                {insights.suggestions && insights.suggestions.map(function(s, i) {
                  return (
                    <p key={i} style={{ color: '#e2e8f0', padding: '0.5rem', background: '#0f172a', borderRadius: '6px', marginBottom: '0.5rem', fontSize: '13px' }}>
                      {s}
                    </p>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const card = { background: '#1e293b', padding: '1.25rem', borderRadius: '12px' };
const cardLabel = { color: '#94a3b8', fontSize: '12px', margin: '0 0 0.25rem' };
const cardValue = { fontSize: 'clamp(16px, 4vw, 22px)', fontWeight: '700', margin: 0 };
const inputStyle = { width: '100%', padding: '0.6rem 1rem', marginBottom: '0.75rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' };
const btnStyle = { width: '100%', padding: '0.75rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: '600' };
const smallBtn = { padding: '0.4rem 0.75rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' };