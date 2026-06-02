const express = require('express');
const { protect } = require('../middleware/auth');
const { exportFoodLogs, exportWeightLogs, exportWorkouts } = require('../controllers/exportController');

const router = express.Router();

router.use(protect);

router.get('/food-logs', exportFoodLogs);
router.get('/weight', exportWeightLogs);
router.get('/workouts', exportWorkouts);

module.exports = router;
