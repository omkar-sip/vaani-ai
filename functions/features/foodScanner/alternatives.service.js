const { INGREDIENT_RULES } = require('../../config/ingredientRules');
const { normalizeToken } = require('./ingredientAnalyzer');

function getCategoryAlternatives(productName) {
  const normalizedName = normalizeToken(productName);
  if (!normalizedName) return [];

  const category = INGREDIENT_RULES.productCategoryAlternatives.find(({ keywords }) =>
    keywords.some((keyword) => normalizedName.includes(normalizeToken(keyword)))
  );

  return category ? category.alternatives : [];
}

function getCategoryHomeSuggestions(productName) {
  const normalizedName = normalizeToken(productName);
  if (!normalizedName) return [];

  const category = INGREDIENT_RULES.productCategoryHomeSuggestions.find(({ keywords }) =>
    keywords.some((keyword) => normalizedName.includes(normalizeToken(keyword)))
  );

  return category ? category.suggestions : [];
}

function getTagAlternatives(tags) {
  const alternatives = [];
  for (const tag of tags || []) {
    for (const option of INGREDIENT_RULES.tagAlternatives[tag] || []) {
      if (!alternatives.some((existing) => existing.name === option.name)) {
        alternatives.push(option);
      }
    }
  }
  return alternatives;
}

function getTagHomeSuggestions(tags) {
  const suggestions = [];
  for (const tag of tags || []) {
    for (const option of INGREDIENT_RULES.tagHomeSuggestions[tag] || []) {
      if (!suggestions.some((existing) => existing.name === option.name)) {
        suggestions.push(option);
      }
    }
  }
  return suggestions;
}

function recommendAlternatives({ productName, riskLevel, matchedTags }) {
  if (riskLevel === 'GOOD') return [];

  const options = [...getCategoryAlternatives(productName), ...getTagAlternatives(matchedTags)];
  const seen = new Set();
  const unique = [];

  for (const option of options) {
    if (!seen.has(option.name)) {
      seen.add(option.name);
      unique.push(option);
    }
    if (unique.length === 3) break;
  }

  if (!unique.length) {
    return [
      {
        name: 'Whole-food alternative',
        reason: 'Choose a less processed version with fewer additives. Usually easy to find online or at a large grocery store.',
        availability: 'ONLINE',
      },
      {
        name: 'Homemade fruit and yogurt bowl',
        reason: 'Can be made at home for a similar sweet and creamy taste with better ingredient control.',
        availability: 'HOME',
      },
      {
        name: 'Low-sodium or low-sugar version',
        reason: 'Look for a simpler label online or in-store when the current product seems heavily processed.',
        availability: 'ONLINE',
      },
    ];
  }

  return unique.map((option) => ({
    availability: option.availability || 'ONLINE',
    ...option,
  }));
}

function recommendHomeSuggestions({ productName, riskLevel, matchedTags }) {
  if (riskLevel === 'GOOD') return [];

  const options = [...getCategoryHomeSuggestions(productName), ...getTagHomeSuggestions(matchedTags)];
  const seen = new Set();
  const unique = [];

  for (const option of options) {
    if (!seen.has(option.name)) {
      seen.add(option.name);
      unique.push(option);
    }
    if (unique.length === 3) break;
  }

  if (!unique.length) {
    return [
      { name: 'Homemade fruit bowl', reason: 'A simple fresh option when you want a cleaner sweet replacement.' },
      { name: 'Roasted snack mix', reason: 'Useful when you want a savory replacement with fewer additives.' },
    ];
  }

  return unique;
}

module.exports = {
  recommendAlternatives,
  recommendHomeSuggestions,
};
