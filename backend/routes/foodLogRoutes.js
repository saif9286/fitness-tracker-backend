const express = require('express');
const { protect } = require('../middleware/auth');
const { logFood, getDailyLog, getDailySummary, deleteLogEntry, updateLogEntry } = require('../controllers/foodLogController');

const router = express.Router();

router.use(protect);

router.post('/', logFood);
router.get('/', getDailyLog);
router.get('/summary', getDailySummary);
router.put('/:id', updateLogEntry);
router.delete('/:id', deleteLogEntry);

module.exports = router;
