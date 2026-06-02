const express = require('express');
const { protect } = require('../middleware/auth');
const { getStreaks, checkAndUpdateStreaks } = require('../controllers/streakController');

const router = express.Router();

router.use(protect);
router.get('/', getStreaks);
router.post('/check', checkAndUpdateStreaks);

module.exports = router;
