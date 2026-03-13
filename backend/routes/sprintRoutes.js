const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getSprints, getActiveSprint } = require('../controllers/sprintController');

router.use(protect);

router.get('/active', getActiveSprint);
router.get('/', getSprints);

module.exports = router;
