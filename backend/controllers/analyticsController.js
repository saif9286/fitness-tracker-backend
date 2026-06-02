const prisma = require('../config/db');

// @desc    Get dashboard data
// @route   GET /api/analytics/dashboard
const getDashboardData = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const userId = req.user.id;

    // Profile
    const profile = await prisma.userProfile.findUnique({ where: { user_id: userId } });

    // Today's food summary
    const foodLogs = await prisma.foodLog.findMany({
      where: { user_id: userId, date: new Date(today) },
      include: { food: true },
    });
    const nutrition = foodLogs.reduce(
      (acc, log) => {
        acc.protein += log.food.protein * log.quantity;
        acc.calories += log.food.calories * log.quantity;
        acc.carbs += log.food.carbs * log.quantity;
        acc.fat += log.food.fat * log.quantity;
        return acc;
      },
      { protein: 0, calories: 0, carbs: 0, fat: 0 }
    );
    Object.keys(nutrition).forEach((k) => {
      nutrition[k] = Math.round(nutrition[k] * 10) / 10;
    });

    // Water today
    const waterLogs = await prisma.waterLog.findMany({
      where: { user_id: userId, date: new Date(today) },
    });
    const waterMl = waterLogs.reduce((sum, l) => sum + l.amount, 0);

    // Latest weight
    const latestWeight = await prisma.weightLog.findFirst({
      where: { user_id: userId },
      orderBy: { date: 'desc' },
    });

    // Streaks
    const streaks = await prisma.streak.findMany({ where: { user_id: userId } });
    const streakMap = {};
    streaks.forEach((s) => {
      streakMap[s.type] = { count: s.count, best: s.best };
    });

    // Today's workouts
    const todayWorkouts = await prisma.workout.findMany({
      where: { user_id: userId, date: new Date(today) },
    });

    // Recent food logs (last 5)
    const recentLogs = foodLogs.slice(-5).map((l) => ({
      id: l.id,
      food_name: l.food.food_name,
      protein: Math.round(l.food.protein * l.quantity),
      calories: Math.round(l.food.calories * l.quantity),
      meal_type: l.meal_type,
      quantity: l.quantity,
    }));

    res.json({
      success: true,
      data: {
        nutrition,
        targets: {
          protein: profile?.protein_goal || 150,
          calories: profile?.calorie_goal || 2200,
          water: (profile?.water_goal || 3) * 1000,
        },
        water: { totalMl: waterMl, totalLitres: Math.round(waterMl / 100) / 10 },
        weight: latestWeight,
        streaks: streakMap,
        workouts: {
          count: todayWorkouts.length,
          totalVolume: todayWorkouts.reduce((s, w) => s + w.sets * w.reps * (w.weight || 0), 0),
        },
        recentLogs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get protein trends
// @route   GET /api/analytics/trends/protein?days=7
const getProteinTrends = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const logs = await prisma.foodLog.findMany({
        where: { user_id: req.user.id, date: new Date(dateStr) },
        include: { food: true },
      });

      const protein = logs.reduce((sum, l) => sum + l.food.protein * l.quantity, 0);
      const calories = logs.reduce((sum, l) => sum + l.food.calories * l.quantity, 0);

      data.push({
        date: dateStr,
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        protein: Math.round(protein),
        calories: Math.round(calories),
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get weight trends
// @route   GET /api/analytics/trends/weight?days=30
const getWeightTrends = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.weightLog.findMany({
      where: { user_id: req.user.id, date: { gte: startDate } },
      orderBy: { date: 'asc' },
    });

    const data = logs.map((l) => ({
      date: l.date.toISOString().split('T')[0],
      weight: l.weight,
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get workout frequency
// @route   GET /api/analytics/trends/workout?days=30
const getWorkoutFrequency = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const workouts = await prisma.workout.findMany({
      where: { user_id: req.user.id, date: { gte: startDate } },
      orderBy: { date: 'asc' },
    });

    // Group by date
    const byDate = {};
    workouts.forEach((w) => {
      const date = w.date.toISOString().split('T')[0];
      if (!byDate[date]) byDate[date] = { count: 0, volume: 0 };
      byDate[date].count++;
      byDate[date].volume += w.sets * w.reps * (w.weight || 0);
    });

    res.json({ success: true, data: byDate });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardData, getProteinTrends, getWeightTrends, getWorkoutFrequency };
