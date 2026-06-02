const axios = require('axios');

// @desc    Search external nutrition API
// @route   GET /api/nutrition/search?q=chicken+breast
const searchExternal = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }

    // Try CalorieNinjas API (free, no signup for basic)
    const apiKey = process.env.NUTRITION_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      return res.json({
        success: true,
        message: 'Nutrition API not configured. Using local database only.',
        data: [],
      });
    }

    const response = await axios.get('https://api.calorieninjas.com/v1/nutrition', {
      params: { query: q },
      headers: { 'X-Api-Key': apiKey },
    });

    const results = (response.data.items || []).map((item) => ({
      food_name: item.name,
      protein: Math.round(item.protein_g * 10) / 10,
      calories: Math.round(item.calories * 10) / 10,
      carbs: Math.round(item.carbohydrates_total_g * 10) / 10,
      fat: Math.round(item.fat_total_g * 10) / 10,
      fiber: Math.round(item.fiber_g * 10) / 10,
      serving: `${item.serving_size_g || 100}g`,
    }));

    res.json({ success: true, data: results });
  } catch (error) {
    // Fallback gracefully
    res.json({
      success: true,
      message: 'External API unavailable. Using local database.',
      data: [],
    });
  }
};

module.exports = { searchExternal };
