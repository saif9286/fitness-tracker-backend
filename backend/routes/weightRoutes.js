const express = require('express');
const { protect } = require('../middleware/auth');
const { logWeight, getWeightHistory } = require('../controllers/weightController');

const router = express.Router();

router.use(protect);
router.post('/', logWeight);
router.get('/', getWeightHistory);

module.exports = router;
