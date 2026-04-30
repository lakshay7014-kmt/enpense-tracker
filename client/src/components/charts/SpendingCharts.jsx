import { useState, useEffect } from 'react';
import { getTransactions } from '../../services/api';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const COLORS = ['#6366f1', '#4ade80', '#f87171', '#eab308', '#f97316', '#818cf8', '#34d399', '#fb7185'];

export default function SpendingCharts() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async () => {
    try {
      const res = await getTransactions();
      setTransactions(res.data.transactions);
    } catch (err) { console.log(err); }
  };

  const categoryData = () => {
    var data = {};
    transactions.filter(function(t) { return t.type === 'expense'; }).forEach(function(t) {
      data[t.category] = (data[t.category] || 0) + Number(t.amount);
    });
    return Object.entries(data).map(function(entry) { return { name: entry[0], value: entry[1] }; });
  };

  const incomeExpenseData = () => {
    var totalIncome = transactions.filter(function(t) { return t.type === 'income'; }).reduce(function(s, t) { return s + Number(t.amount); }, 0);
    var totalExpense = transactions.filter(function(t) { return t.type === 'expense'; }).reduce(function(s, t) { return s + Number(t.amount); }, 0);
    return [
      { name: 'Income', amount: totalIncome },
      { name: 'Expense', amount: totalExpense },
      { name: 'Balance', amount: totalIncome - totalExpense }
    ];
  };

  const dateWiseData = () => {
    var data = {};
    transactions.forEach(function(t) {
      var date = new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (!data[date]) data[date] = { date: date, income: 0, expense: 0 };
      if (t.type === 'income') data[date].income += Number(t.amount);
      else data[date].expense += Number(t.amount);
    });
    return Object.values(data).slice(-7);
  };

  var totalIncome = transactions.filter(function(t) { return t.type === 'income'; }).reduce(function(s, t) { return s + Number(t.amount); }, 0);
  var totalExpense = transactions.filter(function(t) { return t.type === 'expense'; }).reduce(function(s, t) { return s + Number(t.amount); }, 0);

  if (transactions.length === 0) {
    return (
      <div style={{ padding: '0.5rem', color: '#fff' }}>
        <h2 style={{ color: '#e2e8f0', marginBottom: '1rem' }}>Spending Charts</h2>
        <div style={{ background: '#1e293b', padding: '3rem', borderRadius: '12px', textAlign: 'center', color: '#94a3b8' }}>
          <p style={{ fontSize: '48px', margin: '0 0 1rem' }}>📊</p>
          <p>Add some transactions first to see charts!</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0.5rem', color: '#fff' }}>
      <h2 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: 'clamp(18px, 4vw, 24px)' }}>Spending Charts</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={card}>
          <p style={cardLabel}>Total Income</p>
          <p style={{ ...cardValue, color: '#4ade80' }}>Rs.{totalIncome.toLocaleString()}</p>
        </div>
        <div style={card}>
          <p style={cardLabel}>Total Expense</p>
          <p style={{ ...cardValue, color: '#f87171' }}>Rs.{totalExpense.toLocaleString()}</p>
        </div>
        <div style={card}>
          <p style={cardLabel}>Savings</p>
          <p style={{ ...cardValue, color: '#818cf8' }}>
            {totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0}%
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div style={card}>
          <h3 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: 'clamp(13px, 3vw, 16px)' }}>Category wise Expense</h3>
          {categoryData().length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>No expenses yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData()} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={function(entry) { return entry.name; }} labelLine={false}>
                  {categoryData().map(function(_, index) {
                    return <Cell key={index} fill={COLORS[index % COLORS.length]} />;
                  })}
                </Pie>
                <Tooltip formatter={function(value) { return 'Rs.' + value.toLocaleString(); }} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={card}>
          <h3 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: 'clamp(13px, 3vw, 16px)' }}>Income vs Expense</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incomeExpenseData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={function(v) { return 'Rs.' + (v/1000).toFixed(0) + 'k'; }} />
              <Tooltip formatter={function(value) { return 'Rs.' + value.toLocaleString(); }} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {incomeExpenseData().map(function(entry, index) {
                  return <Cell key={index} fill={entry.name === 'Income' ? '#4ade80' : entry.name === 'Expense' ? '#f87171' : '#818cf8'} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {dateWiseData().length > 0 && (
        <div style={card}>
          <h3 style={{ color: '#e2e8f0', marginBottom: '1rem', fontSize: 'clamp(13px, 3vw, 16px)' }}>Daily Income vs Expense</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dateWiseData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={function(v) { return 'Rs.' + (v/1000).toFixed(0) + 'k'; }} />
              <Tooltip formatter={function(value) { return 'Rs.' + value.toLocaleString(); }} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#4ade80" strokeWidth={2} name="Income" />
              <Line type="monotone" dataKey="expense" stroke="#f87171" strokeWidth={2} name="Expense" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

const card = { background: '#1e293b', padding: '1.25rem', borderRadius: '12px' };
const cardLabel = { color: '#94a3b8', fontSize: '12px', margin: '0 0 0.25rem' };
const cardValue = { fontSize: 'clamp(16px, 4vw, 22px)', fontWeight: '700', margin: 0 };