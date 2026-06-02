const express = require('express');
const { protect } = require('../middleware/auth');
const { logWater, getDailyWater, deleteWaterLog } = require('../controllers/waterController');

const router = express.Router();

router.use(protect);
router.post('/', logWater);
router.get('/', getDailyWater);
router.delete('/:id', deleteWaterLog);

module.exports = router;
