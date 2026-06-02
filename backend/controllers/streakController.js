const prisma = require('../config/db');

// @desc    Get user streaks
// @route   GET /api/streaks
const getStreaks = async (req, res, next) => {
  try {
    const streaks = await prisma.streak.findMany({
      where: { user_id: req.user.id },
    });

    const streakMap = {};
    streaks.forEach((s) => {
      streakMap[s.type] = { count: s.count, best: s.best, last_date: s.last_date };
    });

    res.json({ success: true, data: streakMap });
  } catch (error) {
    next(error);
  }
};

// @desc    Update streak (called internally after goal completion)
// @route   POST /api/streaks/check
const checkAndUpdateStreaks = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check protein goal
    const profile = await prisma.userProfile.findUnique({
      where: { user_id: req.user.id },
    });

    if (profile) {
      // Protein streak
      const logs = await prisma.foodLog.findMany({
        where: { user_id: req.user.id, date: new Date(today) },
        include: { food: true },
      });
      const totalProtein = logs.reduce((sum, l) => sum + l.food.protein * l.quantity, 0);

      if (totalProtein >= (profile.protein_goal || 150)) {
        await updateStreak(req.user.id, 'protein_goal', today, yesterday);
      }

      // Workout streak
      const workouts = await prisma.workout.findMany({
        where: { user_id: req.user.id, date: new Date(today) },
      });
      if (workouts.length > 0) {
        await updateStreak(req.user.id, 'workout', today, yesterday);
      }

      // Water streak
      const waterLogs = await prisma.waterLog.findMany({
        where: { user_id: req.user.id, date: new Date(today) },
      });
      const totalWater = waterLogs.reduce((sum, l) => sum + l.amount, 0);
      if (totalWater >= (profile.water_goal || 3) * 1000) {
        await updateStreak(req.user.id, 'water_goal', today, yesterday);
      }
    }

    const streaks = await prisma.streak.findMany({
      where: { user_id: req.user.id },
    });

    res.json({ success: true, data: streaks });
  } catch (error) {
    next(error);
  }
};

async function updateStreak(userId, type, today, yesterday) {
  const existing = await prisma.streak.findUnique({
    where: { user_id_type: { user_id: userId, type } },
  });

  if (existing) {
    const lastDate = existing.last_date.toISOString().split('T')[0];
    if (lastDate === today) return; // Already updated today

    let newCount;
    if (lastDate === yesterday) {
      newCount = existing.count + 1; // Consecutive
    } else {
      newCount = 1; // Reset
    }

    await prisma.streak.update({
      where: { user_id_type: { user_id: userId, type } },
      data: {
        count: newCount,
        best: Math.max(existing.best, newCount),
        last_date: new Date(today),
      },
    });
  } else {
    await prisma.streak.create({
      data: {
        user_id: userId,
        type,
        count: 1,
        best: 1,
        last_date: new Date(today),
      },
    });
  }
}

module.exports = { getStreaks, checkAndUpdateStreaks };
