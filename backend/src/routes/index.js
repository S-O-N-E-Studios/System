const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');

router.use('/auth', authRoutes);

router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    version: '1.0.0'
  });
});

module.exports = router;
