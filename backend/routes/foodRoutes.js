const express = require('express');
const { protect } = require('../middleware/auth');
const { getAllFoods, searchFoods, getFoodById, addFood } = require('../controllers/foodController');

const router = express.Router();

router.get('/', getAllFoods);
router.get('/search', searchFoods);
router.get('/:id', getFoodById);
router.post('/', protect, addFood);

module.exports = router;
