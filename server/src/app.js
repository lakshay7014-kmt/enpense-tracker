const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',         require('./routes/auth.routes'));
app.use('/api/transactions', require('./routes/transactions.routes'));
app.use('/api/bills',        require('./routes/bills.routes'));
app.use('/api/budgets',      require('./routes/budgets.routes'));
app.use('/api/ai',           require('./routes/ai.routes'));
app.use('/api/alerts',       require('./routes/alerts.routes'));

module.exports = app;