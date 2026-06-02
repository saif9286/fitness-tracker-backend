const prisma = require('../config/db');

const foods = [
  // Indian Vegetarian
  { food_name: 'Paneer (Cottage Cheese)', protein: 18.3, calories: 265, carbs: 1.2, fat: 20.8, fiber: 0, diet_type: 'vegetarian', meal_type: 'any', serving: '100g' },
  { food_name: 'Rajma (Kidney Beans)', protein: 8.7, calories: 127, carbs: 22.8, fat: 0.5, fiber: 6.4, diet_type: 'vegan', meal_type: 'lunch', serving: '100g' },
  { food_name: 'Soya Chunks', protein: 52, calories: 336, carbs: 33, fat: 0.5, fiber: 13, diet_type: 'vegan', meal_type: 'any', serving: '100g' },
  { food_name: 'Chana (Chickpeas)', protein: 19, calories: 364, carbs: 61, fat: 6, fiber: 17, diet_type: 'vegan', meal_type: 'lunch', serving: '100g' },
  { food_name: 'Moong Dal', protein: 24, calories: 347, carbs: 59, fat: 1.2, fiber: 16, diet_type: 'vegan', meal_type: 'lunch', serving: '100g' },
  { food_name: 'Toor Dal', protein: 22, calories: 343, carbs: 57, fat: 1.5, fiber: 15, diet_type: 'vegan', meal_type: 'lunch', serving: '100g' },
  { food_name: 'Masoor Dal (Red Lentils)', protein: 25, calories: 352, carbs: 60, fat: 1, fiber: 11, diet_type: 'vegan', meal_type: 'lunch', serving: '100g' },
  { food_name: 'Curd (Yogurt)', protein: 11, calories: 98, carbs: 3.4, fat: 4.3, fiber: 0, diet_type: 'vegetarian', meal_type: 'any', serving: '200g' },
  { food_name: 'Milk (Full Fat)', protein: 3.2, calories: 62, carbs: 4.8, fat: 3.3, fiber: 0, diet_type: 'vegetarian', meal_type: 'breakfast', serving: '100ml' },
  { food_name: 'Roti (Wheat)', protein: 3, calories: 104, carbs: 18, fat: 3.5, fiber: 1.9, diet_type: 'vegan', meal_type: 'any', serving: '1 roti' },
  { food_name: 'Rice (Cooked)', protein: 2.7, calories: 130, carbs: 28, fat: 0.3, fiber: 0.4, diet_type: 'vegan', meal_type: 'lunch', serving: '100g' },
  { food_name: 'Idli', protein: 2, calories: 39, carbs: 8, fat: 0.1, fiber: 0.5, diet_type: 'vegan', meal_type: 'breakfast', serving: '1 piece' },
  { food_name: 'Dosa', protein: 4, calories: 133, carbs: 19, fat: 4.5, fiber: 1.5, diet_type: 'vegan', meal_type: 'breakfast', serving: '1 piece' },
  { food_name: 'Poha', protein: 2.5, calories: 130, carbs: 25, fat: 2, fiber: 1, diet_type: 'vegan', meal_type: 'breakfast', serving: '100g' },
  { food_name: 'Upma', protein: 3, calories: 140, carbs: 24, fat: 3.5, fiber: 2, diet_type: 'vegan', meal_type: 'breakfast', serving: '100g' },
  { food_name: 'Paratha (Plain)', protein: 4, calories: 180, carbs: 24, fat: 7.5, fiber: 2, diet_type: 'vegan', meal_type: 'breakfast', serving: '1 piece' },
  { food_name: 'Peanuts', protein: 26, calories: 567, carbs: 16, fat: 49, fiber: 8.5, diet_type: 'vegan', meal_type: 'snack', serving: '100g' },
  { food_name: 'Almonds', protein: 21, calories: 579, carbs: 22, fat: 50, fiber: 12, diet_type: 'vegan', meal_type: 'snack', serving: '100g' },
  { food_name: 'Peanut Butter', protein: 25, calories: 588, carbs: 20, fat: 50, fiber: 6, diet_type: 'vegan', meal_type: 'snack', serving: '100g' },
  { food_name: 'Tofu', protein: 8, calories: 76, carbs: 1.9, fat: 4.8, fiber: 0.3, diet_type: 'vegan', meal_type: 'any', serving: '100g' },
  { food_name: 'Sprouts (Mixed)', protein: 3.5, calories: 30, carbs: 5.5, fat: 0.2, fiber: 1.8, diet_type: 'vegan', meal_type: 'snack', serving: '100g' },
  { food_name: 'Palak Paneer', protein: 12, calories: 180, carbs: 8, fat: 12, fiber: 3, diet_type: 'vegetarian', meal_type: 'lunch', serving: '200g' },
  { food_name: 'Buttermilk (Chaas)', protein: 3.3, calories: 40, carbs: 5, fat: 0.9, fiber: 0, diet_type: 'vegetarian', meal_type: 'any', serving: '250ml' },

  // Egg-based
  { food_name: 'Boiled Egg', protein: 6.3, calories: 78, carbs: 0.6, fat: 5.3, fiber: 0, diet_type: 'eggetarian', meal_type: 'any', serving: '1 egg' },
  { food_name: 'Egg Whites (2)', protein: 7.2, calories: 34, carbs: 0.5, fat: 0.2, fiber: 0, diet_type: 'eggetarian', meal_type: 'breakfast', serving: '2 whites' },
  { food_name: 'Omelette (2 Eggs)', protein: 13, calories: 189, carbs: 1, fat: 14, fiber: 0, diet_type: 'eggetarian', meal_type: 'breakfast', serving: '2 eggs' },
  { food_name: 'Egg Bhurji', protein: 14, calories: 210, carbs: 3, fat: 16, fiber: 0.5, diet_type: 'eggetarian', meal_type: 'breakfast', serving: '2 eggs' },

  // Non-Vegetarian
  { food_name: 'Chicken Breast (Grilled)', protein: 31, calories: 165, carbs: 0, fat: 3.6, fiber: 0, diet_type: 'non-vegetarian', meal_type: 'any', serving: '100g' },
  { food_name: 'Chicken Thigh', protein: 26, calories: 209, carbs: 0, fat: 10.9, fiber: 0, diet_type: 'non-vegetarian', meal_type: 'lunch', serving: '100g' },
  { food_name: 'Fish (Rohu)', protein: 17, calories: 97, carbs: 0, fat: 1.4, fiber: 0, diet_type: 'non-vegetarian', meal_type: 'lunch', serving: '100g' },
  { food_name: 'Salmon', protein: 20, calories: 208, carbs: 0, fat: 13, fiber: 0, diet_type: 'non-vegetarian', meal_type: 'dinner', serving: '100g' },
  { food_name: 'Tuna (Canned)', protein: 26, calories: 116, carbs: 0, fat: 1, fiber: 0, diet_type: 'non-vegetarian', meal_type: 'any', serving: '100g' },
  { food_name: 'Mutton (Lean)', protein: 25, calories: 250, carbs: 0, fat: 15, fiber: 0, diet_type: 'non-vegetarian', meal_type: 'dinner', serving: '100g' },
  { food_name: 'Prawns', protein: 24, calories: 99, carbs: 0.2, fat: 0.3, fiber: 0, diet_type: 'non-vegetarian', meal_type: 'dinner', serving: '100g' },
  { food_name: 'Tandoori Chicken', protein: 28, calories: 195, carbs: 3, fat: 8, fiber: 0, diet_type: 'non-vegetarian', meal_type: 'dinner', serving: '100g' },
  { food_name: 'Chicken Tikka', protein: 25, calories: 180, carbs: 5, fat: 7, fiber: 0.5, diet_type: 'non-vegetarian', meal_type: 'dinner', serving: '100g' },

  // International / Common
  { food_name: 'Oats (Cooked)', protein: 5, calories: 150, carbs: 27, fat: 3, fiber: 4, diet_type: 'vegan', meal_type: 'breakfast', serving: '100g' },
  { food_name: 'Greek Yogurt', protein: 10, calories: 59, carbs: 3.6, fat: 0.4, fiber: 0, diet_type: 'vegetarian', meal_type: 'snack', serving: '100g' },
  { food_name: 'Whey Protein Scoop', protein: 24, calories: 120, carbs: 3, fat: 1, fiber: 0, diet_type: 'vegetarian', meal_type: 'snack', serving: '1 scoop (30g)' },
  { food_name: 'Banana', protein: 1.1, calories: 89, carbs: 23, fat: 0.3, fiber: 2.6, diet_type: 'vegan', meal_type: 'snack', serving: '1 medium' },
  { food_name: 'Apple', protein: 0.3, calories: 52, carbs: 14, fat: 0.2, fiber: 2.4, diet_type: 'vegan', meal_type: 'snack', serving: '1 medium' },
  { food_name: 'Sweet Potato', protein: 1.6, calories: 86, carbs: 20, fat: 0.1, fiber: 3, diet_type: 'vegan', meal_type: 'any', serving: '100g' },
  { food_name: 'Brown Rice (Cooked)', protein: 2.6, calories: 111, carbs: 23, fat: 0.9, fiber: 1.8, diet_type: 'vegan', meal_type: 'lunch', serving: '100g' },
  { food_name: 'Quinoa (Cooked)', protein: 4.4, calories: 120, carbs: 21, fat: 1.9, fiber: 2.8, diet_type: 'vegan', meal_type: 'lunch', serving: '100g' },
  { food_name: 'Avocado', protein: 2, calories: 160, carbs: 9, fat: 15, fiber: 7, diet_type: 'vegan', meal_type: 'any', serving: '100g' },
  { food_name: 'Cottage Cheese (Low Fat)', protein: 11, calories: 98, carbs: 3.4, fat: 4.3, fiber: 0, diet_type: 'vegetarian', meal_type: 'snack', serving: '100g' },
  { food_name: 'Walnuts', protein: 15, calories: 654, carbs: 14, fat: 65, fiber: 7, diet_type: 'vegan', meal_type: 'snack', serving: '100g' },
  { food_name: 'Chia Seeds', protein: 17, calories: 486, carbs: 42, fat: 31, fiber: 34, diet_type: 'vegan', meal_type: 'breakfast', serving: '100g' },
  { food_name: 'Flax Seeds', protein: 18, calories: 534, carbs: 29, fat: 42, fiber: 27, diet_type: 'vegan', meal_type: 'breakfast', serving: '100g' },
  { food_name: 'Dates (Dried)', protein: 2.5, calories: 282, carbs: 75, fat: 0.4, fiber: 8, diet_type: 'vegan', meal_type: 'snack', serving: '100g' },
  { food_name: 'Dark Chocolate (70%)', protein: 7.8, calories: 598, carbs: 46, fat: 43, fiber: 11, diet_type: 'vegan', meal_type: 'snack', serving: '100g' },
  { food_name: 'Muesli', protein: 10, calories: 370, carbs: 67, fat: 6, fiber: 7, diet_type: 'vegetarian', meal_type: 'breakfast', serving: '100g' },
  { food_name: 'Protein Bar', protein: 20, calories: 220, carbs: 25, fat: 8, fiber: 3, diet_type: 'vegetarian', meal_type: 'snack', serving: '1 bar (60g)' },
];

async function main() {
  console.log('🌱 Seeding database...\n');

  // Clear existing foods
  await prisma.food.deleteMany();
  console.log('   Cleared existing food data');

  // Insert foods
  const created = await prisma.food.createMany({
    data: foods,
  });

  console.log(`   ✅ Inserted ${created.count} food items\n`);

  // Seed achievements
  await prisma.achievement.deleteMany();
  const achievements = [
    { name: 'First Log', description: 'Log your first food item', icon: '🎯', condition: 'first_food_log' },
    { name: 'Protein Pro', description: 'Hit your protein goal for the first time', icon: '💪', condition: 'first_protein_goal' },
    { name: 'Week Warrior', description: 'Maintain a 7-day protein streak', icon: '🔥', condition: 'protein_streak_7' },
    { name: 'Hydration Hero', description: 'Hit your water goal 5 days in a row', icon: '💧', condition: 'water_streak_5' },
    { name: 'Iron Will', description: 'Log 10 workout sessions', icon: '🏋️', condition: 'workout_count_10' },
    { name: 'Century Club', description: 'Eat 100g+ protein in a single day', icon: '💯', condition: 'protein_100g_day' },
    { name: 'Consistency King', description: '30-day logging streak', icon: '👑', condition: 'logging_streak_30' },
    { name: 'Early Bird', description: 'Log breakfast before 8 AM', icon: '🌅', condition: 'early_breakfast' },
  ];

  const createdAch = await prisma.achievement.createMany({
    data: achievements,
  });

  console.log(`   ✅ Inserted ${createdAch.count} achievements\n`);
  console.log('🎉 Seeding complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
