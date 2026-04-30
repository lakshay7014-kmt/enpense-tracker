import { useState, useEffect } from 'react';
import { getBudgets, addBudget } from '../../services/api';

export default function BudgetManager() {
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState({ category: '', limitAmount: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchBudgets(); }, []);

  const fetchBudgets = async () => {
    try {
      const res = await getBudgets();
      setBudgets(res.data.budgets);
    } catch (err) { console.log(err); }
  };

  const handleAdd = async () => {
    if (!form.category || !form.limitAmount) return;
    setLoading(true);
    try {
      await addBudget(form);
      setForm({ category: '', limitAmount: '' });
      fetchBudgets();
    } catch (err) { console.log(err); }
    setLoading(false);
  };

  const getBarColor = (percent) => {
    if (percent >= 100) return '#ef4444';
    if (percent >= 80) return '#f97316';
    if (percent >= 50) return '#eab308';
    return '#4ade80';
  };

  const categories = ['Food', 'Housing', 'Transport', 'Entertainment', 'Utilities', 'Health', 'Shopping', 'Education', 'General'];

  return (
    <div style={{ padding: '0.5rem', color: '#fff' }}>
      <h2 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: 'clamp(18px, 4vw, 24px)' }}>Budget Manager</h2>

      <div style={card}>
        <h3 style={{ marginBottom: '1rem', color: '#e2e8f0', fontSize: 'clamp(14px, 3vw, 18px)' }}>Set New Budget</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <select
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            style={inputStyle}
          >
            <option value="">Select Category</option>
            {categories.map(function(c) {
              return <option key={c} value={c}>{c}</option>;
            })}
          </select>
          <input
            placeholder="Monthly limit (Rs.)"
            type="number"
            value={form.limitAmount}
            onChange={e => setForm({ ...form, limitAmount: e.target.value })}
            style={inputStyle}
          />
        </div>
        <button onClick={handleAdd} disabled={loading} style={{ ...btnStyle, marginTop: '0.75rem' }}>
          {loading ? 'Setting...' : '+ Set Budget'}
        </button>
      </div>

      <div style={{ marginTop: '1rem' }}>
        {budgets.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
            No budgets set yet
          </div>
        ) : (
          budgets.map(function(budget) {
            var spent = Number(budget.spent_amount || budget.spentAmount || 0);
            var limit = Number(budget.limit_amount || budget.limitAmount || 0);
            var percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
            var remaining = limit - spent;
            var barColor = getBarColor(percent);

            return (
              <div key={budget.id} style={{ ...card, marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', color: '#e2e8f0', fontSize: 'clamp(14px, 3vw, 16px)' }}>{budget.category}</h4>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>
                      Rs.{spent.toLocaleString()} / Rs.{limit.toLocaleString()} spent
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 0.25rem', color: barColor, fontWeight: '700', fontSize: 'clamp(16px, 4vw, 20px)' }}>
                      {Math.round(percent)}%
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: remaining >= 0 ? '#4ade80' : '#ef4444' }}>
                      {remaining >= 0 ? 'Rs.' + remaining.toLocaleString() + ' left' : 'Rs.' + Math.abs(remaining).toLocaleString() + ' over!'}
                    </p>
                  </div>
                </div>

                <div style={{ background: '#0f172a', borderRadius: '99px', height: '10px', overflow: 'hidden' }}>
                  <div style={{
                    width: percent + '%', height: '100%',
                    background: barColor, borderRadius: '99px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>

                {percent >= 80 && (
                  <div style={{
                    marginTop: '0.75rem', padding: '0.5rem 0.75rem',
                    background: percent >= 100 ? '#450a0a' : '#431407',
                    borderRadius: '8px', fontSize: '13px',
                    color: percent >= 100 ? '#f87171' : '#f97316'
                  }}>
                    {percent >= 100 ? 'Budget finished! Stop spending!' : 'Warning! 80% of budget used!'}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const card = { background: '#1e293b', padding: '1.25rem', borderRadius: '12px' };
const inputStyle = { width: '100%', padding: '0.6rem 1rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' };
const btnStyle = { width: '100%', padding: '0.75rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: '600' };