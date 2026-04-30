const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const knex = require('../db/knex');

router.get('/', auth, async (req, res) => {
  try {
    const transactions = await knex('transactions')
      .where({ user_id: req.user.id })
      .orderBy('date', 'desc');

    const fixed = transactions.map(t => ({
      ...t,
      amount: parseFloat(t.amount) || 0
    }));

    const total = fixed.reduce((sum, t) =>
      t.type === 'income' ? sum + t.amount : sum - t.amount, 0);

    res.json({ transactions: fixed, total, count: fixed.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { description, amount, type, category } = req.body;
    const [transaction] = await knex('transactions')
      .insert({
        user_id: req.user.id,
        description,
        amount: parseFloat(amount),
        type,
        category: category || 'General'
      })
      .returning('*');

    transaction.amount = parseFloat(transaction.amount);
    res.json({ message: 'Transaction added!', transaction });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await knex('transactions')
      .where({ id: req.params.id, user_id: req.user.id })
      .delete();
    res.json({ message: 'Transaction deleted!' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;