const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const knex = require('../db/knex');

router.get('/', auth, async (req, res) => {
  try {
    const budgets = await knex('budgets').where({ user_id: req.user.id });
    res.json({ budgets });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { category, limitAmount } = req.body;
    const [budget] = await knex('budgets')
      .insert({ user_id: req.user.id, category, limit_amount: limitAmount, spent_amount: 0 })
      .returning('*');
    res.json({ message: 'Budget set ho gaya!', budget });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await knex('budgets')
      .where({ id: req.params.id, user_id: req.user.id })
      .delete();
    res.json({ message: 'Budget delete ho gaya!' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;