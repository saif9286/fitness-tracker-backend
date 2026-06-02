/**
 * Calculate BMI from height (cm) and weight (kg)
 */
const calculateBMI = (heightCm, weightKg) => {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
};

/**
 * Calculate BMR using Mifflin-St Jeor Equation
 * gender: 'male' | 'female'
 */
const calculateBMR = (weightKg, heightCm, age, gender) => {
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
};

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
 */
const calculateTDEE = (bmr, activityLevel) => {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return Math.round(bmr * (multipliers[activityLevel] || 1.2));
};

/**
 * Calculate recommended daily protein based on goal
 * goal: 'muscle_gain' | 'weight_loss' | 'maintenance'
 */
const calculateProteinGoal = (weightKg, goal) => {
  const multipliers = {
    muscle_gain: 2.0,    // 2g per kg for muscle gain
    weight_loss: 1.6,    // 1.6g per kg for weight loss (preserving muscle)
    maintenance: 1.2,    // 1.2g per kg for maintenance
  };
  return Math.round(weightKg * (multipliers[goal] || 1.2));
};

/**
 * Calculate daily calorie goal based on TDEE and goal
 */
const calculateCalorieGoal = (tdee, goal) => {
  switch (goal) {
    case 'muscle_gain':
      return Math.round(tdee + 300); // surplus
    case 'weight_loss':
      return Math.round(tdee - 400); // deficit
    default:
      return Math.round(tdee);
  }
};

/**
 * Get all nutrition calculations from profile data
 */
const calculateAllNutrition = ({ weight, height, age, gender, goal, activity_level }) => {
  const bmi = calculateBMI(height, weight);
  const bmr = calculateBMR(weight, height, age, gender);
  const tdee = calculateTDEE(bmr, activity_level);
  const proteinGoal = calculateProteinGoal(weight, goal);
  const calorieGoal = calculateCalorieGoal(tdee, goal);

  return { bmi, bmr, tdee, proteinGoal, calorieGoal };
};

module.exports = {
  calculateBMI,
  calculateBMR,
  calculateTDEE,
  calculateProteinGoal,
  calculateCalorieGoal,
  calculateAllNutrition,
};
