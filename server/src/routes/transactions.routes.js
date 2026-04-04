const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const knex = require('../db/knex');

router.get('/', auth, async (req, res) => {
  try {
    const transactions = await knex('transactions')
      .where({ user_id: req.user.id })
      .orderBy('date', 'desc');
    const total = transactions.reduce((sum, t) =>
      t.type === 'income' ? sum + Number(t.amount) : sum - Number(t.amount), 0);
    res.json({ transactions, total, count: transactions.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { description, amount, type, category } = req.body;
    const [transaction] = await knex('transactions')
      .insert({ user_id: req.user.id, description, amount, type, category: category || 'General' })
      .returning('*');
    res.json({ message: 'Transaction add ho gaya!', transaction });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await knex('transactions')
      .where({ id: req.params.id, user_id: req.user.id })
      .delete();
    res.json({ message: 'Transaction delete ho gaya!' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;