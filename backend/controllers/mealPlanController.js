const prisma = require('../config/db');

// @desc    Generate a full day meal plan
// @route   POST /api/meal-plan/generate
const generateDailyPlan = async (req, res, next) => {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { user_id: req.user.id },
    });
    if (!profile) {
      return res.status(400).json({ success: false, message: 'Complete your profile first' });
    }

    const proteinTarget = profile.protein_goal || 150;
    const calorieTarget = profile.calorie_goal || 2200;

    // Meal distribution ratios
    const distribution = {
      breakfast: { protein: 0.2, calories: 0.25 },
      lunch: { protein: 0.35, calories: 0.35 },
      dinner: { protein: 0.3, calories: 0.3 },
      snack: { protein: 0.15, calories: 0.1 },
    };

    // Get compatible foods
    const dietCompatibility = {
      vegan: ['vegan'],
      vegetarian: ['vegetarian', 'vegan'],
      eggetarian: ['vegetarian', 'vegan', 'eggetarian'],
      'non-vegetarian': ['vegetarian', 'vegan', 'eggetarian', 'non-vegetarian'],
    };

    const allFoods = await prisma.food.findMany({
      where: {
        diet_type: { in: dietCompatibility[profile.diet_type] || ['vegetarian'] },
      },
    });

    const mealPlan = {};
    const usedFoodIds = new Set();

    for (const [mealType, ratios] of Object.entries(distribution)) {
      const targetProtein = proteinTarget * ratios.protein;
      const targetCalories = calorieTarget * ratios.calories;

      // Get foods suitable for this meal
      let suitableFoods = allFoods.filter(
        (f) => (f.meal_type === mealType || f.meal_type === 'any') && !usedFoodIds.has(f.id)
      );

      // If not enough meal-specific foods, use any
      if (suitableFoods.length < 3) {
        suitableFoods = allFoods.filter((f) => !usedFoodIds.has(f.id));
      }

      // Greedy selection: pick foods until we hit targets
      const selected = [];
      let currentProtein = 0;
      let currentCalories = 0;

      // Sort by protein density for muscle gain, calorie efficiency for weight loss
      if (profile.goal === 'weight_loss') {
        suitableFoods.sort((a, b) => (b.protein / b.calories) - (a.protein / a.calories));
      } else {
        suitableFoods.sort((a, b) => b.protein - a.protein);
      }

      for (const food of suitableFoods) {
        if (selected.length >= 3) break;
        if (currentProtein >= targetProtein && currentCalories >= targetCalories) break;

        // Calculate quantity to fit targets
        let quantity = 1;
        if (food.protein > 0) {
          const proteinNeeded = targetProtein - currentProtein;
          quantity = Math.min(Math.max(Math.round(proteinNeeded / food.protein * 10) / 10, 0.5), 3);
        }

        selected.push({ food, quantity });
        currentProtein += food.protein * quantity;
        currentCalories += food.calories * quantity;
        usedFoodIds.add(food.id);
      }

      mealPlan[mealType] = {
        foods: selected,
        totals: {
          protein: Math.round(currentProtein),
          calories: Math.round(currentCalories),
        },
      };
    }

    // Calculate grand total
    const grandTotal = Object.values(mealPlan).reduce(
      (acc, meal) => ({
        protein: acc.protein + meal.totals.protein,
        calories: acc.calories + meal.totals.calories,
      }),
      { protein: 0, calories: 0 }
    );

    res.json({
      success: true,
      data: {
        mealPlan,
        grandTotal,
        targets: { protein: proteinTarget, calories: calorieTarget },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateDailyPlan };
