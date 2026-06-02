const prisma = require('../config/db');

// @desc    Log a food item
// @route   POST /api/food-logs
const logFood = async (req, res, next) => {
  try {
    const { food_id, quantity, meal_type, date } = req.body;

    const log = await prisma.foodLog.create({
      data: {
        user_id: req.user.id,
        food_id,
        quantity,
        meal_type,
        date: date ? new Date(date) : new Date(new Date().toISOString().split('T')[0]),
      },
      include: { food: true },
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

// @desc    Get daily food log
// @route   GET /api/food-logs?date=YYYY-MM-DD
const getDailyLog = async (req, res, next) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const date = new Date(dateStr);

    const logs = await prisma.foodLog.findMany({
      where: {
        user_id: req.user.id,
        date,
      },
      include: { food: true },
      orderBy: { id: 'asc' },
    });

    // Group by meal type
    const grouped = {
      breakfast: logs.filter((l) => l.meal_type === 'breakfast'),
      lunch: logs.filter((l) => l.meal_type === 'lunch'),
      dinner: logs.filter((l) => l.meal_type === 'dinner'),
      snack: logs.filter((l) => l.meal_type === 'snack'),
    };

    res.json({ success: true, data: { logs, grouped, date: dateStr } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get daily nutrition summary
// @route   GET /api/food-logs/summary?date=YYYY-MM-DD
const getDailySummary = async (req, res, next) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const date = new Date(dateStr);

    const logs = await prisma.foodLog.findMany({
      where: { user_id: req.user.id, date },
      include: { food: true },
    });

    const summary = logs.reduce(
      (acc, log) => {
        const multiplier = log.quantity;
        acc.protein += log.food.protein * multiplier;
        acc.calories += log.food.calories * multiplier;
        acc.carbs += log.food.carbs * multiplier;
        acc.fat += log.food.fat * multiplier;
        acc.fiber += log.food.fiber * multiplier;
        return acc;
      },
      { protein: 0, calories: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    // Round values
    Object.keys(summary).forEach((key) => {
      summary[key] = Math.round(summary[key] * 10) / 10;
    });

    res.json({
      success: true,
      data: { ...summary, date: dateStr, totalItems: logs.length },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a food log entry
// @route   DELETE /api/food-logs/:id
const deleteLogEntry = async (req, res, next) => {
  try {
    const log = await prisma.foodLog.findFirst({
      where: { id: parseInt(req.params.id), user_id: req.user.id },
    });
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log entry not found' });
    }

    await prisma.foodLog.delete({ where: { id: log.id } });
    res.json({ success: true, message: 'Entry deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update food log entry
// @route   PUT /api/food-logs/:id
const updateLogEntry = async (req, res, next) => {
  try {
    const { quantity, meal_type } = req.body;
    const log = await prisma.foodLog.findFirst({
      where: { id: parseInt(req.params.id), user_id: req.user.id },
    });
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log entry not found' });
    }

    const updated = await prisma.foodLog.update({
      where: { id: log.id },
      data: { quantity, meal_type },
      include: { food: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { logFood, getDailyLog, getDailySummary, deleteLogEntry, updateLogEntry };
