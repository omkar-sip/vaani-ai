import { translate } from '../i18n/index.js';

const GEMINI_URL = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

export function extractGeminiText(candidate) {
  return (candidate?.content?.parts || [])
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('');
}

function shouldRetryStructuredReply(text, requiredSeparator, finishReason) {
  if (!requiredSeparator) return false;
  if (text.includes(requiredSeparator)) return false;
  if (!text.trim()) return true;
  if (finishReason === 'MAX_TOKENS') return true;
  return /[A-Za-z0-9)]$/.test(text.trim());
}

/**
 * @param {string} apiKey
 * @param {string} systemPrompt
 * @param {{ role: string, content: string }[]} userMessages
 * @param {{ requiredSeparator?: string, retryCount?: number }} [options]
 * @returns {Promise<string>}
 */
export async function callGemini(apiKey, systemPrompt, userMessages, options = {}) {
  const { requiredSeparator, retryCount = 0 } = options;
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
      generationConfig: { maxOutputTokens: 1400, temperature: 0.7 },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Gemini API ' + response.status);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const text = extractGeminiText(candidate);

  if (retryCount < 1 && shouldRetryStructuredReply(text, requiredSeparator, candidate?.finishReason)) {
    const continuation = await callGemini(
      apiKey,
      systemPrompt,
      [
        ...userMessages,
        { role: 'assistant', content: text },
        {
          role: 'user',
          content:
            `Continue exactly from where you stopped. Do not restart or repeat earlier text. ` +
            `Finish the sentence cleanly and include ${requiredSeparator} followed by the required JSON block exactly once.`,
        },
      ],
      { requiredSeparator, retryCount: retryCount + 1 }
    );
    return `${text}${continuation}`;
  }

  return text;
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
      json: {
        patient_name: '',
        patient_age: '',
        patient_gender: '',
        consultation_reason: '',
        chief_complaint: '',
        language_detected: 'en',
        intent: 'greeting',
      },
    },
    {
      textKey: 'demoHealthDuration',
      json: {
        patient_name: 'Ravi',
        patient_age: '34',
        patient_gender: 'Male',
        consultation_reason: 'headache and fever',
        chief_complaint: 'headache and fever',
        symptoms: 'headache, fever',
        language_detected: 'en',
        intent: 'symptom_assessment',
      },
    },
    {
      textKey: 'demoHealthAdvice',
      json: {
        patient_name: 'Ravi',
        patient_age: '34',
        patient_gender: 'Male',
        consultation_reason: 'headache and fever',
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
