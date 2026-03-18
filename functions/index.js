const { onRequest } = require('firebase-functions/v2/https');

/**
 * Proxy for Gemini API calls in production.
 * The client calls this function instead of hitting Gemini directly,
 * so the API key is never exposed to the browser.
 *
 * TODO: Implement actual Gemini proxy logic.
 */
exports.geminiProxy = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    res.status(500).json({ error: 'GEMINI_API_KEY not configured in Cloud Functions environment.' });
    return;
  }

  try {
    const { contents, generationConfig } = req.body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig }),
      }
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
