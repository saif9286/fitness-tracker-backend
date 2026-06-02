const express = require('express');
const { protect } = require('../middleware/auth');
const { logWorkout, getDailyWorkout, getWorkoutHistory, deleteWorkout } = require('../controllers/workoutController');

const router = express.Router();

router.use(protect);
router.post('/', logWorkout);
router.get('/', getDailyWorkout);
router.get('/history', getWorkoutHistory);
router.delete('/:id', deleteWorkout);

module.exports = router;
