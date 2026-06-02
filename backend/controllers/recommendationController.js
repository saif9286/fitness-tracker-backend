const prisma = require('../config/db');

// @desc    Get smart meal recommendations
// @route   GET /api/recommendations?meal_type=lunch
const getRecommendations = async (req, res, next) => {
  try {
    const { meal_type } = req.query;

    // Get user profile
    const profile = await prisma.userProfile.findUnique({
      where: { user_id: req.user.id },
    });
    if (!profile) {
      return res.status(400).json({ success: false, message: 'Complete your profile first' });
    }

    // Get today's summary
    const today = new Date().toISOString().split('T')[0];
    const logs = await prisma.foodLog.findMany({
      where: { user_id: req.user.id, date: new Date(today) },
      include: { food: true },
    });

    const consumed = logs.reduce(
      (acc, log) => {
        acc.protein += log.food.protein * log.quantity;
        acc.calories += log.food.calories * log.quantity;
        return acc;
      },
      { protein: 0, calories: 0 }
    );

    const remainingProtein = Math.max(0, (profile.protein_goal || 150) - consumed.protein);
    const remainingCalories = Math.max(0, (profile.calorie_goal || 2200) - consumed.calories);

    // Build food query
    const where = {};

    // Filter by diet type compatibility
    const dietCompatibility = {
      vegan: ['vegan'],
      vegetarian: ['vegetarian', 'vegan'],
      eggetarian: ['vegetarian', 'vegan', 'eggetarian'],
      'non-vegetarian': ['vegetarian', 'vegan', 'eggetarian', 'non-vegetarian'],
    };
    where.diet_type = { in: dietCompatibility[profile.diet_type] || ['vegetarian'] };

    if (meal_type) {
      where.OR = [{ meal_type }, { meal_type: 'any' }];
    }

    let foods = await prisma.food.findMany({ where, take: 100 });

    // Score foods based on goal
    foods = foods.map((food) => {
      let score = 0;
      const proteinDensity = food.protein / Math.max(food.calories, 1);

      if (profile.goal === 'muscle_gain') {
        score = food.protein * 3 + proteinDensity * 100;
      } else if (profile.goal === 'weight_loss') {
        score = proteinDensity * 200 - food.calories * 0.5;
      } else {
        score = food.protein * 2 + proteinDensity * 50;
      }

      // Bonus if food fits remaining budget well
      if (food.protein <= remainingProtein && food.calories <= remainingCalories) {
        score += 20;
      }

      return { ...food, score, proteinDensity: Math.round(proteinDensity * 100) / 100 };
    });

    // Sort by score and take top results
    foods.sort((a, b) => b.score - a.score);
    const recommendations = foods.slice(0, 10);

    res.json({
      success: true,
      data: {
        recommendations,
        remaining: {
          protein: Math.round(remainingProtein),
          calories: Math.round(remainingCalories),
        },
        profile: {
          goal: profile.goal,
          diet_type: profile.diet_type,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRecommendations };
