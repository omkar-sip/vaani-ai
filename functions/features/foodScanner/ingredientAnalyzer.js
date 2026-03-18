const { INGREDIENT_RULES } = require('../../config/ingredientRules');

const RISK_PRIORITY = {
  GOOD: 0,
  CAUTION: 1,
  AVOID: 2,
};

function normalizeToken(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s%-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeList(values) {
  return [...new Set((values || []).map(normalizeToken).filter(Boolean))];
}

function canonicalizeConditions(conditions) {
  const normalized = normalizeList(conditions);
  const matched = new Set();

  for (const value of normalized) {
    let found = false;
    for (const [canonical, aliases] of Object.entries(INGREDIENT_RULES.conditionAliases)) {
      const pool = [canonical, ...aliases];
      if (pool.some((alias) => value.includes(normalizeToken(alias)))) {
        matched.add(canonical);
        found = true;
      }
    }
    if (!found) {
      matched.add(value);
    }
  }

  return [...matched];
}

function ingredientMatches(ingredient, needle) {
  if (!ingredient || !needle) return false;
  return ingredient.includes(normalizeToken(needle));
}

function pushAlert(alerts, nextAlert) {
  const key = `${nextAlert.ingredient}|${nextAlert.reason}`;
  if (!alerts.some((alert) => `${alert.ingredient}|${alert.reason}` === key)) {
    alerts.push(nextAlert);
  }
}

function analyzeIngredients({ ingredients, allergies, conditions }) {
  const normalizedIngredients = normalizeList(ingredients);
  const normalizedAllergies = normalizeList(allergies);
  const normalizedConditions = canonicalizeConditions(conditions);
  const alerts = [];
  const matchedTags = new Set();
  let riskLevel = 'GOOD';

  for (const ingredient of normalizedIngredients) {
    for (const allergy of normalizedAllergies) {
      const synonyms = INGREDIENT_RULES.allergySynonyms[allergy] || [allergy];
      if (synonyms.some((token) => ingredientMatches(ingredient, token))) {
        const reason = `Matches your allergy trigger: ${allergy}.`;
        pushAlert(alerts, {
          ingredient,
          reason,
          severity: 'AVOID',
          tags: [allergy],
        });
        matchedTags.add(allergy);
        riskLevel = 'AVOID';
      }
    }
  }

  for (const condition of normalizedConditions) {
    const rules = INGREDIENT_RULES.conditionRules[condition] || [];
    for (const ingredient of normalizedIngredients) {
      for (const rule of rules) {
        if (rule.ingredients.some((token) => ingredientMatches(ingredient, token))) {
          pushAlert(alerts, {
            ingredient,
            reason: rule.reason,
            severity: rule.severity,
            tags: rule.tags || [],
          });
          for (const tag of rule.tags || []) matchedTags.add(tag);
          if (RISK_PRIORITY[rule.severity] > RISK_PRIORITY[riskLevel]) {
            riskLevel = rule.severity;
          }
        }
      }
    }
  }

  for (const ingredient of normalizedIngredients) {
    for (const rule of INGREDIENT_RULES.genericRules) {
      if (rule.ingredients.some((token) => ingredientMatches(ingredient, token))) {
        pushAlert(alerts, {
          ingredient,
          reason: rule.reason,
          severity: rule.severity,
          tags: rule.tags || [],
        });
        for (const tag of rule.tags || []) matchedTags.add(tag);
        if (RISK_PRIORITY[rule.severity] > RISK_PRIORITY[riskLevel]) {
          riskLevel = rule.severity;
        }
      }
    }
  }

  return {
    ingredients: normalizedIngredients,
    riskLevel,
    alerts,
    matchedTags: [...matchedTags],
    matchedConditions: normalizedConditions,
  };
}

module.exports = {
  analyzeIngredients,
  canonicalizeConditions,
  normalizeList,
  normalizeToken,
};
