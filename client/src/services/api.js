import axios from 'axios';

const API = axios.create({ 
  baseURL: 'https://enpense-tracker-production-7014.up.railway.app/api'
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);

export const getTransactions = () => API.get('/transactions');
export const addTransaction = (data) => API.post('/transactions', data);
export const deleteTransaction = (id) => API.delete(`/transactions/${id}`);

export const getBudgets = () => API.get('/budgets');
export const addBudget = (data) => API.post('/budgets', data);

export const categorizeAI = (description) => API.post('/ai/categorize', { description });
export const getInsights = (transactions) => API.post('/ai/insights', { transactions });

export const getBills = () => API.get('/bills');
export const addBill = (data) => API.post('/bills', data);
export const toggleAutoPay = (id) => API.patch(`/bills/${id}/autopay`);
export const payBill = (id) => API.post(`/bills/${id}/pay`);