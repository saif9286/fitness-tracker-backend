const express = require('express');
const { protect } = require('../middleware/auth');
const { getRecommendations } = require('../controllers/recommendationController');

const router = express.Router();

router.use(protect);
router.get('/', getRecommendations);

module.exports = router;
