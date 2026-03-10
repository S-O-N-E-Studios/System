const express = require('express');
const router = express.Router();

// const authRoutes = require('./authRoutes');
// const projectRoutes = require('./projectRoutes');
// const taskRoutes = require('./taskRoutes');
// const userRoutes = require('./userRoutes');

// router.use('/auth', authRoutes);
// router.use('/projects', projectRoutes);
// router.use('/tasks', taskRoutes);
// router.use('/users', userRoutes);

router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    version: '1.0.0'
  });
});

module.exports = router;
