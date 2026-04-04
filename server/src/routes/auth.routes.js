const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const knex = require('../db/knex');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await knex('users').where({ email }).first();
    if (exists) return res.status(400).json({ message: 'Email already registered hai' });
    const password_hash = await bcrypt.hash(password, 10);
    const [user] = await knex('users').insert({ name, email, password_hash }).returning('*');
    const token = jwt.sign({ id: user.id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Register ho gaye!', token, user: { id: user.id, name, email } });
  } catch (err) {
    res.status(500).json({ message: 'Kuch galat hua', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await knex('users').where({ email }).first();
    if (!user) return res.status(400).json({ message: 'Email nahi mila' });
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Password galat hai' });
    const token = jwt.sign({ id: user.id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login ho gaye!', token, user: { id: user.id, name: user.name, email } });
  } catch (err) {
    res.status(500).json({ message: 'Kuch galat hua', error: err.message });
  }
});

module.exports = router;