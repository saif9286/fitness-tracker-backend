const prisma = require('../config/db');
const { calculateAllNutrition } = require('../utils/calculateNutrition');

// @desc    Create user profile (onboarding)
// @route   POST /api/profile
const createProfile = async (req, res, next) => {
  try {
    const { age, gender, height, weight, goal, diet_type, activity_level } = req.body;

    // Check if profile already exists
    const existing = await prisma.userProfile.findUnique({
      where: { user_id: req.user.id },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Profile already exists. Use PUT to update.',
      });
    }

    // Calculate nutrition targets
    const { bmi, bmr, tdee, proteinGoal, calorieGoal } = calculateAllNutrition({
      weight, height, age, gender, goal, activity_level,
    });

    const profile = await prisma.userProfile.create({
      data: {
        user_id: req.user.id,
        age,
        gender,
        height,
        weight,
        goal,
        diet_type,
        activity_level,
        protein_goal: proteinGoal,
        calorie_goal: calorieGoal,
      },
    });

    res.status(201).json({
      success: true,
      data: { ...profile, bmi, bmr, tdee },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/profile
const getProfile = async (req, res, next) => {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { user_id: req.user.id },
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found. Complete onboarding first.',
      });
    }

    const { bmi, bmr, tdee } = calculateAllNutrition({
      weight: profile.weight,
      height: profile.height,
      age: profile.age,
      gender: profile.gender,
      goal: profile.goal,
      activity_level: profile.activity_level,
    });

    res.json({
      success: true,
      data: { ...profile, bmi, bmr, tdee },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
const updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;

    // Recalculate goals if relevant fields changed
    const current = await prisma.userProfile.findUnique({
      where: { user_id: req.user.id },
    });

    if (!current) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
    }

    const merged = { ...current, ...updates };
    const { bmi, bmr, tdee, proteinGoal, calorieGoal } = calculateAllNutrition({
      weight: merged.weight,
      height: merged.height,
      age: merged.age,
      gender: merged.gender,
      goal: merged.goal,
      activity_level: merged.activity_level,
    });

    const profile = await prisma.userProfile.update({
      where: { user_id: req.user.id },
      data: {
        ...updates,
        protein_goal: proteinGoal,
        calorie_goal: calorieGoal,
      },
    });

    res.json({
      success: true,
      data: { ...profile, bmi, bmr, tdee },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createProfile, getProfile, updateProfile };
