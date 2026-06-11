const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Analyze a food photo using Gemini Vision
// @route   POST /api/foods/analyze-photo
// @access  Protected
const analyzeFood = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: 'Gemini API key not configured.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert image buffer to base64 for Gemini
    const imageData = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype,
      },
    };

    const prompt = `You are a nutrition expert. Analyze this food image and identify the main food item(s).

Return a JSON object ONLY (no markdown, no explanation) in this exact format:
{
  "food_name": "Name of the food (be specific, e.g. 'Grilled Chicken Breast' not just 'Chicken')",
  "calories": <number per serving>,
  "protein": <grams per serving>,
  "carbs": <grams per serving>,
  "fat": <grams per serving>,
  "fiber": <grams per serving>,
  "serving": "Estimated serving size (e.g. '1 cup (240ml)' or '1 piece (~150g)')",
  "confidence": "high" | "medium" | "low",
  "notes": "Any important notes, e.g. 'Mixed dish - values are approximate' or leave empty string"
}

Rules:
- If multiple foods are visible, focus on the main/dominant food item
- If you cannot identify any food, return { "error": "Could not identify food in this image" }
- All numeric values must be plain numbers (no units in the value itself)
- Base nutrition values on the estimated serving size shown in the image`;

    const result = await model.generateContent([prompt, imageData]);
    const responseText = result.response.text().trim();

    // Strip potential markdown code fences
    const cleanJson = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    let nutritionData;
    try {
      nutritionData = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('Gemini response parse error:', responseText);
      return res.status(422).json({
        success: false,
        message: 'AI could not parse the food image. Please try a clearer photo.',
      });
    }

    if (nutritionData.error) {
      return res.status(422).json({ success: false, message: nutritionData.error });
    }

    return res.json({
      success: true,
      data: {
        food_name: nutritionData.food_name || 'Unknown Food',
        calories: Math.round(Number(nutritionData.calories) || 0),
        protein: Math.round((Number(nutritionData.protein) || 0) * 10) / 10,
        carbs: Math.round((Number(nutritionData.carbs) || 0) * 10) / 10,
        fat: Math.round((Number(nutritionData.fat) || 0) * 10) / 10,
        fiber: Math.round((Number(nutritionData.fiber) || 0) * 10) / 10,
        serving: nutritionData.serving || '1 serving',
        confidence: nutritionData.confidence || 'medium',
        notes: nutritionData.notes || '',
      },
    });
  } catch (error) {
    console.error('Food analysis error:', error.message);
    // Handle Gemini quota/auth errors gracefully
    if (error.message?.includes('API_KEY')) {
      return res.status(401).json({ success: false, message: 'Invalid Gemini API key.' });
    }
    if (error.message?.includes('quota') || error.message?.includes('429')) {
      return res.status(429).json({ success: false, message: 'AI analysis limit reached. Please try again later.' });
    }
    next(error);
  }
};

module.exports = { analyzeFood };
