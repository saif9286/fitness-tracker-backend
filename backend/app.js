const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const foodRoutes = require('./routes/foodRoutes');
const foodLogRoutes = require('./routes/foodLogRoutes');
const nutritionRoutes = require('./routes/nutritionRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const mealPlanRoutes = require('./routes/mealPlanRoutes');
const weightRoutes = require('./routes/weightRoutes');
const waterRoutes = require('./routes/waterRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const streakRoutes = require('./routes/streakRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const photoRoutes = require('./routes/photoRoutes');
const exportRoutes = require('./routes/exportRoutes');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static uploads folder serving
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/food-logs', foodLogRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/meal-plan', mealPlanRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/streaks', streakRoutes);
app.use('/api/metrics', analyticsRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/export', exportRoutes);

// Error handling
app.use(errorHandler);

module.exports = app;
