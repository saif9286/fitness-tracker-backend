const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { createProfile, getProfile, updateProfile } = require('../controllers/profileController');

const router = express.Router();

router.use(protect);

router.get('/', getProfile);

router.post(
  '/',
  validate([
    body('age').isInt({ min: 13, max: 100 }).withMessage('Age must be between 13-100'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('height').isFloat({ min: 50, max: 300 }).withMessage('Height must be 50-300 cm'),
    body('weight').isFloat({ min: 20, max: 500 }).withMessage('Weight must be 20-500 kg'),
    body('goal').isIn(['muscle_gain', 'weight_loss', 'maintenance']).withMessage('Invalid goal'),
    body('diet_type').isIn(['vegetarian', 'non-vegetarian', 'vegan', 'eggetarian']).withMessage('Invalid diet type'),
    body('activity_level').isIn(['sedentary', 'light', 'moderate', 'active', 'very_active']).withMessage('Invalid activity level'),
  ]),
  createProfile
);

router.put('/', updateProfile);

module.exports = router;
