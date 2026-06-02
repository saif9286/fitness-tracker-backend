const express = require('express');
const { protect } = require('../middleware/auth');
const { getDashboardData, getProteinTrends, getWeightTrends, getWorkoutFrequency } = require('../controllers/analyticsController');

const router = express.Router();

router.use(protect);
router.get('/dashboard', getDashboardData);
router.get('/trends/protein', getProteinTrends);
router.get('/trends/weight', getWeightTrends);
router.get('/trends/workout', getWorkoutFrequency);

module.exports = router;
