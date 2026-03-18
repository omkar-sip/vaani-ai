/**
 * Gemini API wrapper — the ONLY place Gemini calls live.
 * In production, swap the direct API call with a Cloud Function proxy.
 */

const GEMINI_URL = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

/**
 * Call the Gemini API with a system prompt and conversation messages.
 * @param {string} apiKey
 * @param {string} systemPrompt
 * @param {{ role: string, content: string }[]} userMessages
 * @returns {Promise<string>} AI response text
 */
export async function callGemini(apiKey, systemPrompt, userMessages) {
  const contents = userMessages.map((m, i) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [
      {
        text:
          i === 0 && m.role === 'user'
            ? systemPrompt + '\n\nUser: ' + m.content
            : m.content,
      },
    ],
  }));

  const resp = await fetch(GEMINI_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
    }),
  });

  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.error?.message || 'Gemini API ' + resp.status);
  }

  const d = await resp.json();
  return d.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Get a demo response for a given mode and turn index.
 * @param {string} mode - 'companion' | 'health' | 'finance'
 * @param {number} turnIndex
 * @returns {{ text: string, json: object }}
 */
export function getDemoResponse(mode, turnIndex) {
  const pool = DEMO_RESPONSES[mode] || DEMO_RESPONSES.companion;
  const pick = pool[Math.min(turnIndex, pool.length - 1)];
  return pick;
}

// ─── Demo Responses ──────────────────────────────────

const DEMO_RESPONSES = {
  companion: [
    {
      text: "Hey! Good to see you. How are you feeling today — physically and emotionally? 😊",
      json: { mood: '', stress_level: '', sleep_quality: '', habits_mentioned: [], distress: false },
    },
    {
      text: "Sounds like it's been a bit of a rough day. That's okay — acknowledging it is the first step. Did you sleep well last night?",
      json: { mood: '😐', stress_level: 'medium', sleep_quality: '', habits_mentioned: [], distress: false },
    },
    {
      text: "Got it. A bit under 7 hours is manageable. Try winding down 30 minutes earlier tonight — even just putting your phone down helps. Have you had enough water today? 💧",
      json: { mood: '😐', stress_level: 'medium', sleep_quality: 'fair', habits_mentioned: ['sleep'], distress: false },
    },
  ],
  health: [
    {
      text: "Hello! I'm your VaaniAI health consultant. What brings you in today — what's your main concern?",
      json: { chief_complaint: '', language_detected: 'en', intent: 'greeting' },
    },
    {
      text: "I understand. Can you tell me more — how long have you been experiencing this, and how severe would you rate it on a scale of 1 to 10?",
      json: { chief_complaint: 'headache and fever', symptoms: 'headache, fever', language_detected: 'en', intent: 'symptom_assessment' },
    },
    {
      text: "Thank you. Based on what you've shared, this sounds like it could be a viral fever. I'd recommend visiting your nearest PHC today. Stay hydrated, rest, and avoid self-medicating. Do you have any known allergies or existing conditions?",
      json: { chief_complaint: 'headache and fever', symptoms: 'headache, fever, body ache', duration: '3 days', severity: 'Moderate', diagnosis_hint: 'Possible viral fever', recommended_action: 'Visit PHC. Stay hydrated and rest.', language_detected: 'en', intent: 'assessment_and_advice' },
    },
  ],
  finance: [
    {
      text: "Hello! Let's get your records sorted. To start, could you please share your full name and patient/account number?",
      json: { verification_status: 'Pending', language_detected: 'en', intent: 'identity_verification' },
    },
    {
      text: "Thank you. I've found your account. When did you make the payment, and which method did you use — UPI, NEFT, or cash?",
      json: { verification_status: 'Verified', payment_status: 'Outstanding', language_detected: 'en', intent: 'payment_inquiry' },
    },
    {
      text: "Understood. Your ₹5000 UPI payment has been logged in the system. Is there anything else you'd like to update or verify?",
      json: { payment_status: 'Paid', amount_paid: '₹5000', payment_mode: 'UPI', language_detected: 'en', intent: 'payment_confirmation' },
    },
  ],
};
