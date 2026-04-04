const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');

const alerts = [];

// Saare alerts lo
router.get('/', auth, (req, res) => {
  const userAlerts = alerts.filter(a => a.userId === req.user.id);
  res.json({ alerts: userAlerts });
});

// Alert banao
router.post('/settings', auth, (req, res) => {
  const { type, threshold } = req.body;
  const alert = {
    id: Date.now(),
    userId: req.user.id,
    type: type || 'spending_limit',
    threshold: parseFloat(threshold),
    isActive: true,
    createdAt: new Date().toISOString()
  };
  alerts.push(alert);
  res.json({ message: 'Alert set ho gaya!', alert });
});

// Alert dismiss karo
router.patch('/:id/dismiss', auth, (req, res) => {
  const alert = alerts.find(
    a => a.id === parseInt(req.params.id) && a.userId === req.user.id
  );
  if (!alert) return res.status(404).json({ message: 'Alert nahi mila' });
  alert.isActive = false;
  res.json({ message: 'Alert dismiss ho gaya!', alert });
});

module.exports = router;