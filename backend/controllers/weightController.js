const prisma = require('../config/db');

// @desc    Log weight
// @route   POST /api/weight
const logWeight = async (req, res, next) => {
  try {
    const { weight, date } = req.body;
    const logDate = date ? new Date(date) : new Date(new Date().toISOString().split('T')[0]);

    // Upsert: one weight entry per day
    const existing = await prisma.weightLog.findFirst({
      where: { user_id: req.user.id, date: logDate },
    });

    let log;
    if (existing) {
      log = await prisma.weightLog.update({
        where: { id: existing.id },
        data: { weight },
      });
    } else {
      log = await prisma.weightLog.create({
        data: { user_id: req.user.id, weight, date: logDate },
      });
    }

    // Update profile weight
    await prisma.userProfile.updateMany({
      where: { user_id: req.user.id },
      data: { weight },
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

// @desc    Get weight history
// @route   GET /api/weight?days=30
const getWeightHistory = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.weightLog.findMany({
      where: {
        user_id: req.user.id,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

module.exports = { logWeight, getWeightHistory };
