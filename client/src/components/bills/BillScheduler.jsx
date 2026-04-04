import { useState, useEffect } from 'react';
import { getBills, addBill, toggleAutoPay, payBill } from '../../services/api';

export default function BillScheduler() {
  const [bills, setBills] = useState([]);
  const [form, setForm] = useState({ name: '', amount: '', frequency: 'monthly', dueDate: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchBills(); }, []);

  const fetchBills = async () => {
    try {
      const res = await getBills();
      setBills(res.data.bills);
    } catch (err) { console.log(err); }
  };

  const handleAdd = async () => {
    if (!form.name || !form.amount || !form.dueDate) return;
    setLoading(true);
    try {
      await addBill(form);
      setForm({ name: '', amount: '', frequency: 'monthly', dueDate: '' });
      fetchBills();
    } catch (err) { console.log(err); }
    setLoading(false);
  };

  const handleAutoPay = async (id) => {
    await toggleAutoPay(id);
    fetchBills();
  };

  const handlePay = async (id) => {
    await payBill(id);
    fetchBills();
  };

  // Due date check karo
  const getDueStatus = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: 'Overdue!', color: '#ef4444' };
    if (diff === 0) return { text: 'Aaj due hai!', color: '#f97316' };
    if (diff <= 3) return { text: `${diff} din mein due`, color: '#eab308' };
    return { text: `${diff} din baad`, color: '#4ade80' };
  };

  return (
    <div style={{ padding: '1.5rem', color: '#fff' }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#e2e8f0' }}>🗓️ Bill Scheduler</h2>

      {/* Add Bill Form */}
      <div style={card}>
        <h3 style={{ marginBottom: '1rem', color: '#e2e8f0' }}>➕ Naya Bill Add karo</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <input
            placeholder="Bill ka naam (e.g. Netflix)"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            style={inputStyle}
          />
          <input
            placeholder="Amount (₹)"
            type="number"
            value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
            style={inputStyle}
          />
          <select
            value={form.frequency}
            onChange={e => setForm({ ...form, frequency: e.target.value })}
            style={inputStyle}
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="yearly">Yearly</option>
          </select>
          <input
            type="date"
            value={form.dueDate}
            onChange={e => setForm({ ...form, dueDate: e.target.value })}
            style={inputStyle}
          />
        </div>
        <button onClick={handleAdd} disabled={loading} style={{ ...btnStyle, marginTop: '0.75rem' }}>
          {loading ? 'Add ho raha hai...' : '+ Bill Schedule karo'}
        </button>
      </div>

      {/* Bills List */}
      <div style={{ marginTop: '1.5rem' }}>
        {bills.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', color: '#94a3b8' }}>
            Koi bill schedule nahi hai abhi
          </div>
        ) : (
          bills.map(bill => {
            const status = getDueStatus(bill.dueDate);
            return (
              <div key={bill.id} style={{ ...card, marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', color: '#e2e8f0' }}>{bill.name}</h4>
                    <p style={{ margin: '0 0 0.25rem', color: '#94a3b8', fontSize: '13px' }}>
                      ₹{bill.amount} • {bill.frequency}
                    </p>
                    <span style={{ fontSize: '12px', color: status.color, fontWeight: '600' }}>
                      ⏰ {status.text}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    {/* Status badge */}
                    <span style={{
                      padding: '2px 10px', borderRadius: '20px', fontSize: '12px',
                      background: bill.status === 'paid' ? '#166534' : '#7c2d12',
                      color: bill.status === 'paid' ? '#4ade80' : '#f87171'
                    }}>
                      {bill.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                    </span>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {/* Auto Pay Toggle */}
                      <button
                        onClick={() => handleAutoPay(bill.id)}
                        style={{
                          ...smallBtn,
                          background: bill.autoPay ? '#166534' : '#334155',
                          color: bill.autoPay ? '#4ade80' : '#94a3b8'
                        }}
                      >
                        {bill.autoPay ? '🤖 Auto ON' : '🤖 Auto OFF'}
                      </button>

                      {/* Pay Button */}
                      {bill.status !== 'paid' && (
                        <button onClick={() => handlePay(bill.id)} style={{ ...smallBtn, background: '#1d4ed8' }}>
                          💳 Pay karo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
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
const smallBtn = { padding: '0.4rem 0.75rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' };