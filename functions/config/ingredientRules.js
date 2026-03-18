const INGREDIENT_RULES = {
  allergySynonyms: {
    nuts: ['nut', 'nuts', 'almond', 'cashew', 'walnut', 'pecan', 'hazelnut', 'pistachio', 'macadamia'],
    peanut: ['peanut', 'groundnut'],
    gluten: ['wheat', 'barley', 'rye', 'semolina', 'farina', 'malt', 'bulgur', 'atta'],
    lactose: ['milk', 'milk solids', 'milk powder', 'whey', 'casein', 'cream', 'butter', 'lactose'],
    dairy: ['milk', 'milk solids', 'milk powder', 'whey', 'casein', 'cream', 'butter', 'cheese', 'ghee'],
    soy: ['soy', 'soya', 'soybean', 'soy lecithin'],
    sesame: ['sesame', 'til'],
    egg: ['egg', 'albumen', 'egg powder'],
  },
  conditionAliases: {
    diabetes: ['diabetes', 'diabetic', 'high blood sugar'],
    hypertension: ['hypertension', 'high blood pressure', 'bp'],
    pcos: ['pcos', 'pcod'],
    'high cholesterol': ['high cholesterol', 'cholesterol', 'hyperlipidemia', 'lipids'],
    'lactose intolerance': ['lactose intolerance'],
    'gluten intolerance': ['gluten intolerance', 'celiac', 'coeliac'],
  },
  conditionRules: {
    diabetes: [
      {
        severity: 'CAUTION',
        ingredients: ['sugar', 'glucose syrup', 'corn syrup', 'fructose', 'maltose', 'dextrose', 'invert sugar'],
        reason: 'Contains fast-absorbing added sugars that can worsen blood sugar control.',
        tags: ['high-sugar'],
      },
      {
        severity: 'CAUTION',
        ingredients: ['maida', 'refined wheat flour', 'white flour'],
        reason: 'Contains refined flour that may raise blood glucose quickly.',
        tags: ['refined-carb'],
      },
    ],
    hypertension: [
      {
        severity: 'CAUTION',
        ingredients: ['salt', 'sodium', 'msg', 'monosodium glutamate', 'sodium benzoate', 'baking soda'],
        reason: 'Contains sodium-heavy ingredients that may not be ideal for blood pressure control.',
        tags: ['high-sodium'],
      },
    ],
    pcos: [
      {
        severity: 'CAUTION',
        ingredients: ['sugar', 'glucose syrup', 'corn syrup', 'fructose', 'maltose', 'dextrose'],
        reason: 'Contains added sugars that may aggravate insulin resistance commonly seen with PCOS.',
        tags: ['high-sugar'],
      },
      {
        severity: 'CAUTION',
        ingredients: ['maida', 'refined wheat flour', 'white flour', 'hydrogenated vegetable oil'],
        reason: 'Includes refined ingredients that are less suitable for steady energy and metabolic health.',
        tags: ['refined-carb', 'processed-fat'],
      },
    ],
    'high cholesterol': [
      {
        severity: 'CAUTION',
        ingredients: ['hydrogenated vegetable oil', 'partially hydrogenated oil', 'shortening', 'trans fat'],
        reason: 'Contains trans-fat related ingredients that can be harmful for cholesterol management.',
        tags: ['trans-fat'],
      },
      {
        severity: 'CAUTION',
        ingredients: ['palm oil', 'cream', 'butter'],
        reason: 'Contains ingredients that may increase saturated fat intake.',
        tags: ['saturated-fat'],
      },
    ],
    'lactose intolerance': [
      {
        severity: 'AVOID',
        ingredients: ['milk', 'milk solids', 'milk powder', 'whey', 'casein', 'cream', 'lactose'],
        reason: 'Contains dairy-derived ingredients that commonly trigger lactose intolerance symptoms.',
        tags: ['dairy'],
      },
    ],
    'gluten intolerance': [
      {
        severity: 'AVOID',
        ingredients: ['wheat', 'barley', 'rye', 'semolina', 'farina', 'malt', 'bulgur', 'atta'],
        reason: 'Contains gluten-containing grains that are unsuitable for gluten intolerance.',
        tags: ['gluten'],
      },
    ],
  },
  genericRules: [
    {
      severity: 'CAUTION',
      ingredients: ['artificial flavour', 'artificial flavor', 'artificial colour', 'artificial color', 'preservative'],
      reason: 'Contains highly processed additives, so it is better used occasionally.',
      tags: ['processed'],
    },
  ],
  productCategoryAlternatives: [
    {
      keywords: ['cereal', 'corn flakes', 'flakes', 'muesli', 'granola'],
      alternatives: [
        { name: 'Unsweetened oats', reason: 'Higher fiber and easier to portion for steady energy. Easy to buy online or in most supermarkets.', availability: 'ONLINE' },
        { name: 'Unsweetened muesli', reason: 'Usually lower in added sugar than flavored cereals and easy to order online.', availability: 'ONLINE' },
        { name: 'Homemade roasted oats mix', reason: 'Can be made at home for a similar crunchy breakfast taste with better control over sugar.', availability: 'HOME' },
      ],
    },
    {
      keywords: ['chips', 'crisps', 'namkeen'],
      alternatives: [
        { name: 'Roasted chana', reason: 'Offers more protein and usually less sodium than chips. Easy to buy online or locally.', availability: 'ONLINE' },
        { name: 'Unsalted nuts or seeds', reason: 'A less processed snack with better fats and easy to order online.', availability: 'ONLINE' },
        { name: 'Baked makhana at home', reason: 'Can be made at home for a similar crunchy snack taste with less salt.', availability: 'HOME' },
      ],
    },
    {
      keywords: ['biscuit', 'cookie'],
      alternatives: [
        { name: 'Whole-grain crackers', reason: 'Lower sugar options are generally easier to fit into a balanced diet and are easy to find online.', availability: 'ONLINE' },
        { name: 'Toast with nut butter', reason: 'Can be made at home for a similar snack feel with better satiety.', availability: 'HOME' },
        { name: 'Fruit with nuts', reason: 'A simple at-home snack with less refined flour and more fiber.', availability: 'HOME' },
      ],
    },
    {
      keywords: ['drink', 'juice', 'soda', 'cola'],
      alternatives: [
        { name: 'Plain sparkling water', reason: 'Cuts added sugar and artificial additives. Easy to buy online or in stores.', availability: 'ONLINE' },
        { name: 'Unsweetened buttermilk', reason: 'A lighter option if dairy is tolerated and often easy to buy.', availability: 'ONLINE' },
        { name: 'Fresh lemon water', reason: 'Can be made at home for a similar refreshing taste with much less sugar.', availability: 'HOME' },
      ],
    },
    {
      keywords: ['noodle', 'instant noodle', 'ramen'],
      alternatives: [
        { name: 'Whole-wheat noodles', reason: 'Usually offer better fiber and satiety and can be found online.', availability: 'ONLINE' },
        { name: 'Millet noodles', reason: 'A lower refined-flour alternative that is commonly available online.', availability: 'ONLINE' },
        { name: 'Homemade vegetable poha', reason: 'Can be made at home for a savory comfort-food alternative with lower sodium.', availability: 'HOME' },
      ],
    },
    {
      keywords: ['ice cream', 'frozen dessert'],
      alternatives: [
        { name: 'Unsweetened yogurt with fruit', reason: 'A lighter dessert option with better protein and easy availability online or in-store.', availability: 'ONLINE' },
        { name: 'Frozen fruit smoothie', reason: 'Can be made at home for a similar cold sweet taste while controlling sugar.', availability: 'HOME' },
        { name: 'Greek yogurt parfait', reason: 'Can be made at home and gives a creamy dessert-like feel with more protein.', availability: 'HOME' },
      ],
    },
  ],
  productCategoryHomeSuggestions: [
    {
      keywords: ['cereal', 'corn flakes', 'flakes', 'muesli', 'granola'],
      suggestions: [
        { name: 'Masala oats bowl', reason: 'Gives a warm savory breakfast feel with better fiber and easy home preparation.' },
        { name: 'Homemade fruit muesli', reason: 'Delivers a similar breakfast taste with better control over sugar and add-ins.' },
      ],
    },
    {
      keywords: ['chips', 'crisps', 'namkeen'],
      suggestions: [
        { name: 'Roasted makhana mix', reason: 'Crunchy like packaged snacks but easier to season lightly at home.' },
        { name: 'Spiced roasted chana', reason: 'Delivers a salty snack feel with more protein and less processing.' },
      ],
    },
    {
      keywords: ['drink', 'juice', 'soda', 'cola'],
      suggestions: [
        { name: 'Mint lemon water', reason: 'Refreshing like a packaged drink but much easier to control sugar at home.' },
        { name: 'Chilled fruit yogurt smoothie', reason: 'Gives a sweet drink feel with more real ingredients.' },
      ],
    },
    {
      keywords: ['biscuit', 'cookie'],
      suggestions: [
        { name: 'Banana oat pancakes', reason: 'Gives a sweet baked taste with fewer processed ingredients.' },
        { name: 'Whole-wheat toast with nut butter', reason: 'Feels like a snack treat while being more filling and simple to prepare.' },
      ],
    },
    {
      keywords: ['noodle', 'instant noodle', 'ramen'],
      suggestions: [
        { name: 'Vegetable poha', reason: 'Comforting and savory like instant noodles but lighter and easier to make wholesome.' },
        { name: 'Homemade millet noodles bowl', reason: 'Keeps a similar noodle experience with better ingredient control.' },
      ],
    },
  ],
  tagHomeSuggestions: {
    'high-sugar': [
      { name: 'Fruit and seed bowl', reason: 'Satisfies sweet cravings with more fiber and less added sugar.' },
      { name: 'Chia yogurt cup', reason: 'Creamy and mildly sweet while being easier to balance at home.' },
    ],
    'high-sodium': [
      { name: 'Homemade roasted snack mix', reason: 'Gives a savory munching option while letting you control the salt.' },
      { name: 'Cucumber yogurt bowl', reason: 'A cooling savory option with much lower sodium.' },
    ],
    'trans-fat': [
      { name: 'Air-popped popcorn', reason: 'Keeps the snack feel while avoiding hydrogenated fats.' },
      { name: 'Baked sweet potato wedges', reason: 'Gives a satisfying crispy feel with simpler ingredients.' },
    ],
  },
  tagAlternatives: {
    'high-sugar': [
      { name: 'Unsweetened oats', reason: 'Reduces added sugar exposure and is easy to buy online.', availability: 'ONLINE' },
      { name: 'Sugar-free yogurt', reason: 'A better fit when limiting added sugars and often available online or in stores.', availability: 'ONLINE' },
      { name: 'Fresh fruit with seeds', reason: 'Can be made at home and gives natural sweetness with fiber.', availability: 'HOME' },
    ],
    'high-sodium': [
      { name: 'Low-sodium version', reason: 'Helps reduce sodium load compared with the current product and is often available online.', availability: 'ONLINE' },
      { name: 'Homemade roasted snack', reason: 'Can be made at home so you fully control the salt level.', availability: 'HOME' },
      { name: 'Plain yogurt dip with vegetables', reason: 'A lower-sodium savory option that can be prepared at home.', availability: 'HOME' },
    ],
    'gluten': [
      { name: 'Certified gluten-free oats', reason: 'A safer packaged option for gluten-sensitive users and easy to order online.', availability: 'ONLINE' },
      { name: 'Millet-based snacks', reason: 'Naturally gluten-free when not cross-contaminated and often available online.', availability: 'ONLINE' },
      { name: 'Rice cakes', reason: 'A simple alternative to wheat-based processed foods and easy to find online.', availability: 'ONLINE' },
    ],
    dairy: [
      { name: 'Plant-based yogurt', reason: 'Avoids lactose-containing dairy ingredients and is easy to order online.', availability: 'ONLINE' },
      { name: 'Lactose-free milk product', reason: 'A safer swap when dairy is still preferred and is commonly available online.', availability: 'ONLINE' },
      { name: 'Coconut yogurt', reason: 'A non-dairy creamy option that can be bought online or made at home.', availability: 'BOTH' },
    ],
    'trans-fat': [
      { name: 'Air-popped snacks', reason: 'Can be made at home and avoid hydrogenated fats used in processed foods.', availability: 'HOME' },
      { name: 'Nut and seed mix', reason: 'Provides healthier fats than products with shortening and is easy to buy online.', availability: 'ONLINE' },
      { name: 'Whole-food snack', reason: 'A simple home-friendly way to reduce ultra-processed fats.', availability: 'HOME' },
    ],
  },
};

module.exports = {
  INGREDIENT_RULES,
};
