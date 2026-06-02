const prisma = require('../config/db');

// Helper function to convert JSON objects to CSV string
const convertToCSV = (headers, rows, mapRowFn) => {
  const headerRow = headers.join(',');
  const dataRows = rows.map(mapRowFn).map((row) =>
    row
      .map((val) => {
        if (val === null || val === undefined) return '';
        // Escape quotes and commas
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
      })
      .join(',')
  );
  return [headerRow, ...dataRows].join('\n');
};

// @desc    Export Food Logs to CSV
// @route   GET /api/export/food-logs
const exportFoodLogs = async (req, res, next) => {
  try {
    const logs = await prisma.foodLog.findMany({
      where: { user_id: req.user.id },
      include: { food: true },
      orderBy: { date: 'desc' },
    });

    const headers = [
      'Date',
      'Meal Type',
      'Food Name',
      'Quantity (Multiplier)',
      'Serving Size',
      'Protein (g)',
      'Calories (kcal)',
      'Carbs (g)',
      'Fat (g)',
      'Fiber (g)',
    ];

    const csvContent = convertToCSV(headers, logs, (log) => [
      log.date.toISOString().split('T')[0],
      log.meal_type,
      log.food.food_name,
      log.quantity,
      log.food.serving,
      Math.round(log.food.protein * log.quantity * 10) / 10,
      Math.round(log.food.calories * log.quantity * 10) / 10,
      Math.round(log.food.carbs * log.quantity * 10) / 10,
      Math.round(log.food.fat * log.quantity * 10) / 10,
      Math.round((log.food.fiber || 0) * log.quantity * 10) / 10,
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=fueltrack-food-logs-${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Export Weight Logs to CSV
// @route   GET /api/export/weight
const exportWeightLogs = async (req, res, next) => {
  try {
    const logs = await prisma.weightLog.findMany({
      where: { user_id: req.user.id },
      orderBy: { date: 'desc' },
    });

    const headers = ['Date', 'Weight (kg)'];

    const csvContent = convertToCSV(headers, logs, (log) => [
      log.date.toISOString().split('T')[0],
      log.weight,
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=fueltrack-weight-logs-${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// @desc    Export Workouts to CSV
// @route   GET /api/export/workouts
const exportWorkouts = async (req, res, next) => {
  try {
    const logs = await prisma.workout.findMany({
      where: { user_id: req.user.id },
      orderBy: { date: 'desc' },
    });

    const headers = ['Date', 'Exercise Name', 'Sets', 'Reps', 'Weight (kg)', 'Duration (mins)'];

    const csvContent = convertToCSV(headers, logs, (log) => [
      log.date.toISOString().split('T')[0],
      log.exercise,
      log.sets,
      log.reps,
      log.weight !== null ? log.weight : '',
      log.duration !== null ? log.duration : '',
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=fueltrack-workouts-${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = { exportFoodLogs, exportWeightLogs, exportWorkouts };
