const express = require('express');
const { protect } = require('../middleware/auth');
const { generateDailyPlan } = require('../controllers/mealPlanController');

const router = express.Router();

router.use(protect);
router.post('/generate', generateDailyPlan);

module.exports = router;
