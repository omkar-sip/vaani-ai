const test = require('node:test');
const assert = require('node:assert/strict');

const { analyzeIngredients } = require('../functions/features/foodScanner/ingredientAnalyzer');
const { recommendAlternatives, recommendHomeSuggestions } = require('../functions/features/foodScanner/alternatives.service');
const { cleanIngredients } = require('../functions/features/foodScanner/foodScanner.service');

test('ingredient analyzer marks allergy matches as avoid', () => {
  const result = analyzeIngredients({
    ingredients: ['Sugar', 'Peanut oil', 'Salt'],
    allergies: ['peanut'],
    conditions: [],
  });

  assert.equal(result.riskLevel, 'AVOID');
  assert.ok(result.alerts.some((alert) => alert.ingredient.includes('peanut')));
});

test('ingredient analyzer flags diabetes triggers with caution', () => {
  const result = analyzeIngredients({
    ingredients: ['Whole grain oats', 'Corn syrup', 'Natural flavour'],
    allergies: [],
    conditions: ['diabetes'],
  });

  assert.equal(result.riskLevel, 'CAUTION');
  assert.ok(result.alerts.some((alert) => /blood sugar/i.test(alert.reason)));
});

test('cleanIngredients normalizes and deduplicates OCR output', () => {
  const result = cleanIngredients('Ingredients: Sugar, Wheat Flour, Sugar, Milk Solids (5%), Salt');

  assert.deepEqual(result, ['Sugar', 'Wheat Flour', 'Milk Solids', 'Salt']);
});

test('alternatives service returns category and tag-based replacements', () => {
  const options = recommendAlternatives({
    productName: 'Chocolate Cereal',
    riskLevel: 'CAUTION',
    matchedTags: ['high-sugar'],
  });

  assert.equal(options.length, 3);
  assert.ok(options.some((option) => /oats|muesli|fiber/i.test(option.name)));
  assert.ok(options.every((option) => option.availability));
});

test('home suggestions return practical dish replacements', () => {
  const options = recommendHomeSuggestions({
    productName: 'Packaged chips',
    riskLevel: 'AVOID',
    matchedTags: ['high-sodium'],
  });

  assert.ok(options.length >= 2);
  assert.ok(options.some((option) => /makhana|roasted|cucumber|popcorn/i.test(option.name)));
});
