const express = require('express');
const { protect } = require('../middleware/auth');
const { searchExternal } = require('../controllers/nutritionController');

const router = express.Router();

router.use(protect);
router.get('/search', searchExternal);

module.exports = router;
