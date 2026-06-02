const prisma = require('../config/db');

// @desc    Log water intake
// @route   POST /api/water
const logWater = async (req, res, next) => {
  try {
    const { amount, date } = req.body; // amount in ml
    const logDate = date ? new Date(date) : new Date(new Date().toISOString().split('T')[0]);

    const log = await prisma.waterLog.create({
      data: { user_id: req.user.id, amount, date: logDate },
    });

    // Get daily total
    const dailyLogs = await prisma.waterLog.findMany({
      where: { user_id: req.user.id, date: logDate },
    });
    const totalMl = dailyLogs.reduce((sum, l) => sum + l.amount, 0);

    res.status(201).json({
      success: true,
      data: { log, dailyTotal: totalMl, dailyTotalLitres: Math.round(totalMl / 100) / 10 },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get daily water intake
// @route   GET /api/water?date=YYYY-MM-DD
const getDailyWater = async (req, res, next) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const date = new Date(dateStr);

    const logs = await prisma.waterLog.findMany({
      where: { user_id: req.user.id, date },
      orderBy: { id: 'asc' },
    });

    const totalMl = logs.reduce((sum, l) => sum + l.amount, 0);

    res.json({
      success: true,
      data: {
        logs,
        totalMl,
        totalLitres: Math.round(totalMl / 100) / 10,
        date: dateStr,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete water log
// @route   DELETE /api/water/:id
const deleteWaterLog = async (req, res, next) => {
  try {
    const log = await prisma.waterLog.findFirst({
      where: { id: parseInt(req.params.id), user_id: req.user.id },
    });
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }
    await prisma.waterLog.delete({ where: { id: log.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { logWater, getDailyWater, deleteWaterLog };
