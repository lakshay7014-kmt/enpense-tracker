const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const knex = require('../db/knex');

router.get('/', auth, async (req, res) => {
  try {
    const bills = await knex('bills').where({ user_id: req.user.id });
    res.json({ bills });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, amount, frequency, dueDate } = req.body;
    const [bill] = await knex('bills')
      .insert({ user_id: req.user.id, name, amount, frequency: frequency || 'monthly', due_date: dueDate })
      .returning('*');
    res.json({ message: 'Bill schedule ho gaya!', bill });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.patch('/:id/autopay', auth, async (req, res) => {
  try {
    const bill = await knex('bills').where({ id: req.params.id, user_id: req.user.id }).first();
    const [updated] = await knex('bills')
      .where({ id: req.params.id })
      .update({ auto_pay: !bill.auto_pay })
      .returning('*');
    res.json({ message: `Auto pay ${updated.auto_pay ? 'on' : 'off'} ho gaya!`, bill: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/pay', auth, async (req, res) => {
  try {
    const [bill] = await knex('bills')
      .where({ id: req.params.id, user_id: req.user.id })
      .update({ status: 'paid' })
      .returning('*');
    res.json({ message: 'Bill paid ho gaya!', bill });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;