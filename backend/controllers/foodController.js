const prisma = require('../config/db');

// @desc    Get all foods with filters
// @route   GET /api/foods
const getAllFoods = async (req, res, next) => {
  try {
    const { diet_type, meal_type, search, page = 1, limit = 50 } = req.query;
    const where = {};

    if (diet_type) where.diet_type = diet_type;
    if (meal_type) where.meal_type = meal_type;
    if (search) {
      where.food_name = { contains: search, mode: 'insensitive' };
    }

    const foods = await prisma.food.findMany({
      where,
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      orderBy: { food_name: 'asc' },
    });

    const total = await prisma.food.count({ where });

    res.json({
      success: true,
      data: foods,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search foods by name
// @route   GET /api/foods/search
const searchFoods = async (req, res, next) => {
  try {
    const { q, diet_type } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }

    const where = {
      food_name: { contains: q, mode: 'insensitive' },
    };
    if (diet_type) where.diet_type = diet_type;

    const foods = await prisma.food.findMany({
      where,
      take: 20,
      orderBy: { food_name: 'asc' },
    });

    res.json({ success: true, data: foods });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single food
// @route   GET /api/foods/:id
const getFoodById = async (req, res, next) => {
  try {
    const food = await prisma.food.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!food) {
      return res.status(404).json({ success: false, message: 'Food not found' });
    }
    res.json({ success: true, data: food });
  } catch (error) {
    next(error);
  }
};

// @desc    Add custom food
// @route   POST /api/foods
const addFood = async (req, res, next) => {
  try {
    const { food_name, protein, calories, carbs, fat, fiber, diet_type, meal_type, serving } = req.body;

    const food = await prisma.food.create({
      data: { food_name, protein, calories, carbs, fat, fiber: fiber || 0, diet_type, meal_type, serving: serving || '100g' },
    });

    res.status(201).json({ success: true, data: food });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllFoods, searchFoods, getFoodById, addFood };
