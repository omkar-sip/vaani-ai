const { analyzeIngredients, normalizeList } = require('./ingredientAnalyzer');
const { recommendAlternatives, recommendHomeSuggestions } = require('./alternatives.service');

const MAX_FILE_SIZE = 6 * 1024 * 1024;
const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const GEMINI_MODEL = 'gemini-2.5-flash';

class FoodScannerError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'FoodScannerError';
    this.status = status;
  }
}

function validateUpload(file) {
  if (!file || !file.buffer?.length) {
    throw new FoodScannerError('Please upload an image of a food label.', 400);
  }
  if (!SUPPORTED_TYPES.has(file.mimetype)) {
    throw new FoodScannerError('Unsupported file type. Please upload a JPG, PNG, or WEBP image.', 400);
  }
  if (file.buffer.length > MAX_FILE_SIZE) {
    throw new FoodScannerError('Image is too large. Please upload an image under 6 MB.', 400);
  }
}

function sanitizeText(value) {
  return String(value || '')
    .replace(/[^\x20-\x7E]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanIngredients(rawIngredients) {
  const input = Array.isArray(rawIngredients)
    ? rawIngredients
    : String(rawIngredients || '')
        .split(/ingredients?\s*:|contains\s*:/i)
        .slice(-1)[0]
        .split(/[,;\n]+/);

  const cleaned = input
    .map((value) =>
      sanitizeText(value)
        .replace(/^\d+[).\s-]*/, '')
        .replace(/\([^)]*\)/g, ' ')
        .replace(/\bcontains\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean)
    .filter((value) => value.length > 1);

  return [...new Set(cleaned)].slice(0, 60);
}

function extractJsonPayload(text) {
  const cleaned = String(text || '').trim();
  const fenced = cleaned.match(/```json([\s\S]*?)```/i);
  const payload = fenced ? fenced[1] : cleaned;
  const firstBrace = payload.indexOf('{');
  const lastBrace = payload.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) {
    throw new FoodScannerError('Unable to extract ingredients clearly. Please upload a clearer image.', 422);
  }
  return JSON.parse(payload.slice(firstBrace, lastBrace + 1));
}

async function callGeminiVision({ apiKey, file }) {
  if (!apiKey) {
    throw new FoodScannerError('Food scanner is not configured. Add GEMINI_API_KEY to enable label analysis.', 500);
  }

  const prompt = `
You are extracting packaged food label information for a healthcare app.
Read the uploaded product label image and return valid JSON only.

Rules:
- Focus on the visible ingredients section.
- Extract ingredient names in English when possible.
- productName should be null if not clear.
- confidence should be "high", "medium", or "low".
- If the ingredient list is not readable, use an empty array.
- Do not guess unseen ingredients.

Output format:
{
  "productName": "string | null",
  "ingredients": ["string"],
  "confidence": "high | medium | low"
}`.trim();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: file.mimetype,
                  data: file.buffer.toString('base64'),
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new FoodScannerError(data.error?.message || 'Failed to analyze the food label image.', 502);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return extractJsonPayload(text);
}

function buildSummary({ mode, productName, riskLevel, alerts, conditions }) {
  const label = productName || 'This product';

  if (riskLevel === 'GOOD') {
    return mode === 'consultant'
      ? `${label} does not show any obvious ingredient conflicts for the supplied allergies or conditions. Continue routine portion control and verify serving size separately.`
      : `${label} looks broadly suitable based on the ingredients we could read. Keep portions balanced and still check the nutrition panel if available.`;
  }

  const conditionText = conditions.length ? ` for ${conditions.join(', ')}` : '';
  const topAlerts = alerts.slice(0, 2).map((alert) => alert.ingredient).join(', ');

  if (riskLevel === 'AVOID') {
    return mode === 'consultant'
      ? `${label} is best avoided${conditionText}. Trigger ingredients identified: ${topAlerts || 'multiple flagged ingredients'}.`
      : `${label} is not a safe pick right now${conditionText}. We found ingredient triggers like ${topAlerts || 'flagged ingredients'}.`;
  }

  return mode === 'consultant'
    ? `${label} should be used with caution${conditionText}. The ingredient list includes ${topAlerts || 'flagged processed ingredients'} that may need review.`
    : `${label} needs a little caution${conditionText}. Some ingredients may not be the best fit, especially ${topAlerts || 'the flagged ingredients we found'}.`;
}

function buildActionSteps({ riskLevel, alerts, alternatives, homeSuggestions, mode }) {
  if (riskLevel === 'GOOD') {
    return [
      'This product looks acceptable based on the visible ingredients.',
      'Still check the nutrition label for sugar, sodium, and portion size before regular use.',
      mode === 'consultant'
        ? 'Document the decision as acceptable if it matches the patient diet plan.'
        : 'Use it in moderation and keep portions sensible.',
    ];
  }

  const firstAlert = alerts[0]?.ingredient || 'the flagged ingredients';
  const topAlternative = alternatives[0]?.name || homeSuggestions[0]?.name || 'a simpler whole-food alternative';

  if (riskLevel === 'AVOID') {
    return [
      `Avoid buying or consuming this product until you review ${firstAlert}.`,
      `Choose a safer replacement such as ${topAlternative}.`,
      mode === 'consultant'
        ? 'Advise the patient to cross-check labels on similar packaged foods before purchase.'
        : 'If you want a similar taste, switch to one of the suggested alternatives instead of this product.',
    ];
  }

  return [
    `Use this only occasionally because of ingredients like ${firstAlert}.`,
    `If you want a better everyday option, try ${topAlternative}.`,
    mode === 'consultant'
      ? 'Explain the flagged ingredients in simple terms before recommending regular use.'
      : 'Prefer a homemade or lower-processed alternative for regular use.',
  ];
}

async function scanFoodLabel({ file, userId, allergies, conditions, mode, apiKey, productName }) {
  validateUpload(file);

  const ocrResult = await callGeminiVision({ apiKey, file });
  const ingredients = cleanIngredients(ocrResult.ingredients);

  if (!ingredients.length || ocrResult.confidence === 'low') {
    throw new FoodScannerError('Unable to extract ingredients clearly. Please upload a clearer image.', 422);
  }

  const normalizedAllergies = normalizeList(allergies);
  const normalizedConditions = normalizeList(conditions);
  const analysis = analyzeIngredients({
    ingredients,
    allergies: normalizedAllergies,
    conditions: normalizedConditions,
  });
  const resolvedProductName = sanitizeText(productName) || sanitizeText(ocrResult.productName) || null;
  const recommendedAlternatives = recommendAlternatives({
    productName: resolvedProductName,
    riskLevel: analysis.riskLevel,
    matchedTags: analysis.matchedTags,
  });
  const homeSuggestions = recommendHomeSuggestions({
    productName: resolvedProductName,
    riskLevel: analysis.riskLevel,
    matchedTags: analysis.matchedTags,
  });

  return {
    userId: userId || null,
    productName: resolvedProductName,
    ingredients: analysis.ingredients,
    riskLevel: analysis.riskLevel,
    summary: buildSummary({
      mode,
      productName: resolvedProductName,
      riskLevel: analysis.riskLevel,
      alerts: analysis.alerts,
      conditions: normalizedConditions,
    }),
    actionSteps: buildActionSteps({
      riskLevel: analysis.riskLevel,
      alerts: analysis.alerts,
      alternatives: recommendedAlternatives,
      homeSuggestions,
      mode,
    }),
    triggeredAlerts: analysis.alerts.map((alert) => ({
      ingredient: alert.ingredient,
      reason: alert.reason,
    })),
    recommendedAlternatives,
    homeSuggestions,
  };
}

module.exports = {
  FoodScannerError,
  MAX_FILE_SIZE,
  SUPPORTED_TYPES,
  cleanIngredients,
  scanFoodLabel,
};
