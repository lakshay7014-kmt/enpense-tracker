import { useState, useEffect } from 'react';
import { getTransactions } from '../../services/api';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

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

  // Category wise data — Pie chart ke liye
  const categoryData = () => {
    const data = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  };

  // Income vs Expense — Bar chart ke liye
  const incomeExpenseData = () => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return [
      { name: 'Income', amount: totalIncome },
      { name: 'Expense', amount: totalExpense },
      { name: 'Balance', amount: totalIncome - totalExpense }
    ];
  };

  // Date wise spending — Line chart ke liye
  const dateWiseData = () => {
    const data = {};
    transactions.forEach(t => {
      const date = new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (!data[date]) data[date] = { date, income: 0, expense: 0 };
      if (t.type === 'income') data[date].income += t.amount;
      else data[date].expense += t.amount;
    });
    return Object.values(data).slice(-7); // Last 7 days
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  if (transactions.length === 0) {
    return (
      <div style={{ padding: '1.5rem', color: '#fff' }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#e2e8f0' }}>📊 Spending Charts</h2>
        <div style={{ ...card, textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
          <p style={{ fontSize: '48px', margin: '0 0 1rem' }}>📊</p>
          <p>Pehle kuch transactions add karo — phir charts dikhenge!</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', color: '#fff' }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#e2e8f0' }}>📊 Spending Charts</h2>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={card}>
          <p style={cardLabel}>Total Income</p>
          <p style={{ ...cardValue, color: '#4ade80' }}>₹{totalIncome.toLocaleString()}</p>
        </div>
        <div style={card}>
          <p style={cardLabel}>Total Expense</p>
          <p style={{ ...cardValue, color: '#f87171' }}>₹{totalExpense.toLocaleString()}</p>
        </div>
        <div style={card}>
          <p style={cardLabel}>Savings</p>
          <p style={{ ...cardValue, color: '#818cf8' }}>
            {totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0}%
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* Pie Chart — Category wise */}
        <div style={card}>
          <h3 style={{ color: '#e2e8f0', marginBottom: '1rem' }}>🥧 Category wise Expense</h3>
          {categoryData().length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Koi expense nahi abhi</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData()}
                  cx="50%" cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                  labelLine={false}
                >
                  {categoryData().map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart — Income vs Expense */}
        <div style={card}>
          <h3 style={{ color: '#e2e8f0', marginBottom: '1rem' }}>📊 Income vs Expense</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={incomeExpenseData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => `₹${value.toLocaleString()}`}
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {incomeExpenseData().map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.name === 'Income' ? '#4ade80' : entry.name === 'Expense' ? '#f87171' : '#818cf8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart — Daily spending */}
      {dateWiseData().length > 0 && (
        <div style={card}>
          <h3 style={{ color: '#e2e8f0', marginBottom: '1rem' }}>📈 Daily Income vs Expense</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dateWiseData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => `₹${value.toLocaleString()}`}
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#4ade80" strokeWidth={2} dot={{ fill: '#4ade80' }} name="Income" />
              <Line type="monotone" dataKey="expense" stroke="#f87171" strokeWidth={2} dot={{ fill: '#f87171' }} name="Expense" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

const card = { background: '#1e293b', padding: '1.5rem', borderRadius: '12px' };
const cardLabel = { color: '#94a3b8', fontSize: '13px', margin: '0 0 0.25rem' };
const cardValue = { fontSize: '24px', fontWeight: '700', margin: 0 };