const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { getAllFoods, searchFoods, getFoodById, addFood } = require('../controllers/foodController');
const { analyzeFood } = require('../controllers/foodAnalysisController');

const router = express.Router();

// Multer memory storage (no disk write — send buffer directly to Gemini)
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

router.get('/', getAllFoods);
router.get('/search', searchFoods);
router.get('/:id', getFoodById);
router.post('/', protect, addFood);

// Food photo AI analysis
router.post('/analyze-photo', protect, memoryUpload.single('photo'), analyzeFood);

module.exports = router;

