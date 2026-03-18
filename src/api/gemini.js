import { translate } from '../i18n';

const GEMINI_URL = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

/**
 * @param {string} apiKey
 * @param {string} systemPrompt
 * @param {{ role: string, content: string }[]} userMessages
 * @returns {Promise<string>}
 */
export async function callGemini(apiKey, systemPrompt, userMessages) {
  const contents = userMessages.map((message, index) => ({
    role: message.role === 'user' ? 'user' : 'model',
    parts: [
      {
        text:
          index === 0 && message.role === 'user'
            ? systemPrompt + '\n\nUser: ' + message.content
            : message.content,
      },
    ],
  }));

  const response = await fetch(GEMINI_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Gemini API ' + response.status);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

const DEMO_RESPONSE_KEYS = {
  companion: [
    {
      textKey: 'demoCompanionGreeting',
      json: { mood: '', stress_level: '', sleep_quality: '', habits_mentioned: [], distress: false },
    },
    {
      textKey: 'demoCompanionSleep',
      json: { mood: 'neutral', stress_level: 'medium', sleep_quality: '', habits_mentioned: [], distress: false },
    },
    {
      textKey: 'demoCompanionWater',
      json: { mood: 'neutral', stress_level: 'medium', sleep_quality: 'fair', habits_mentioned: ['sleep'], distress: false },
    },
  ],
  health: [
    {
      textKey: 'demoHealthGreeting',
      json: { chief_complaint: '', language_detected: 'en', intent: 'greeting' },
    },
    {
      textKey: 'demoHealthDuration',
      json: { chief_complaint: 'headache and fever', symptoms: 'headache, fever', language_detected: 'en', intent: 'symptom_assessment' },
    },
    {
      textKey: 'demoHealthAdvice',
      json: {
        chief_complaint: 'headache and fever',
        symptoms: 'headache, fever, body ache',
        duration: '3 days',
        severity: 'Moderate',
        diagnosis_hint: 'Possible viral fever',
        recommended_action: 'Visit PHC. Stay hydrated and rest.',
        language_detected: 'en',
        intent: 'assessment_and_advice',
      },
    },
  ],
  finance: [
    {
      textKey: 'demoFinanceGreeting',
      json: { verification_status: 'Pending', language_detected: 'en', intent: 'identity_verification' },
    },
    {
      textKey: 'demoFinancePayment',
      json: { verification_status: 'Verified', payment_status: 'Outstanding', language_detected: 'en', intent: 'payment_inquiry' },
    },
    {
      textKey: 'demoFinanceLogged',
      json: { payment_status: 'Paid', amount_paid: 'INR 5000', payment_mode: 'UPI', language_detected: 'en', intent: 'payment_confirmation' },
    },
  ],
};

/**
 * @param {string} mode
 * @param {number} turnIndex
 * @param {string} language
 * @returns {{ text: string, json: object }}
 */
export function getDemoResponse(mode, turnIndex, language = 'en') {
  const pool = DEMO_RESPONSE_KEYS[mode] || DEMO_RESPONSE_KEYS.companion;
  const pick = pool[Math.min(turnIndex, pool.length - 1)];
  return {
    text: translate(language, pick.textKey),
    json: pick.json,
  };
}
