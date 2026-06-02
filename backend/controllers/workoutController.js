const prisma = require('../config/db');

// @desc    Log a workout exercise
// @route   POST /api/workouts
const logWorkout = async (req, res, next) => {
  try {
    const { exercise, sets, reps, weight, duration, date } = req.body;

    const workout = await prisma.workout.create({
      data: {
        user_id: req.user.id,
        exercise,
        sets,
        reps,
        weight: weight || null,
        duration: duration || null,
        date: date ? new Date(date) : new Date(new Date().toISOString().split('T')[0]),
      },
    });

    res.status(201).json({ success: true, data: workout });
  } catch (error) {
    next(error);
  }
};

// @desc    Get daily workout
// @route   GET /api/workouts?date=YYYY-MM-DD
const getDailyWorkout = async (req, res, next) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const date = new Date(dateStr);

    const workouts = await prisma.workout.findMany({
      where: { user_id: req.user.id, date },
      orderBy: { id: 'asc' },
    });

    // Calculate total volume
    const totalVolume = workouts.reduce((sum, w) => {
      return sum + (w.sets * w.reps * (w.weight || 0));
    }, 0);

    res.json({
      success: true,
      data: { workouts, totalVolume, exerciseCount: workouts.length, date: dateStr },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get workout history
// @route   GET /api/workouts/history?days=30
const getWorkoutHistory = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const workouts = await prisma.workout.findMany({
      where: {
        user_id: req.user.id,
        date: { gte: startDate },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ success: true, data: workouts });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a workout entry
// @route   DELETE /api/workouts/:id
const deleteWorkout = async (req, res, next) => {
  try {
    const workout = await prisma.workout.findFirst({
      where: { id: parseInt(req.params.id), user_id: req.user.id },
    });
    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found' });
    }
    await prisma.workout.delete({ where: { id: workout.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { logWorkout, getDailyWorkout, getWorkoutHistory, deleteWorkout };
