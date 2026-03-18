/**
 * Pure helper functions — no side effects, no imports from Firebase or stores.
 */

/**
 * Get current time as a short string (HH:MM).
 * @returns {string}
 */
export function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Promise-based sleep.
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Detect the language of input text.
 * @param {string} text
 * @returns {string}
 */
export function detectLang(text) {
  const kn = /[\u0C80-\u0CFF]/.test(text);
  const hi = /[\u0900-\u097F]/.test(text);
  const en = /[a-zA-Z]/.test(text);
  if (kn && en) return 'KN+EN';
  if (hi && en) return 'Hinglish';
  if (kn) return 'Kannada';
  if (hi) return 'Hindi';
  return 'English';
}

/**
 * Parse companion mode AI reply: separate display text from JSON block.
 * @param {string} text
 * @returns {{ disp: string, json: object|null }}
 */
export function parseCompanionReply(text) {
  const SEP = '---COMPANION_JSON---';
  const idx = text.indexOf(SEP);
  if (idx === -1) return { disp: text, json: null };
  const disp = text.slice(0, idx).trim();
  try {
    return { disp, json: JSON.parse(text.slice(idx + SEP.length).trim()) };
  } catch {
    return { disp, json: null };
  }
}

/**
 * Parse consultant mode AI reply: separate display text from JSON block.
 * @param {string} text
 * @returns {{ disp: string, json: object|null }}
 */
export function parseConsultantReply(text) {
  const SEP = '---JSON---';
  const idx = text.indexOf(SEP);
  if (idx === -1) return { disp: text, json: null };
  const disp = text.slice(0, idx).trim();
  try {
    return {
      disp,
      json: JSON.parse(
        text
          .slice(idx + SEP.length)
          .trim()
          .replace(/```json|```/g, '')
          .trim()
      ),
    };
  } catch {
    return { disp, json: null };
  }
}

/**
 * Guess a session title from the first user message.
 * @param {string} text
 * @param {string} mode - 'companion' | 'consultant'
 * @returns {string}
 */
export function guessTitle(text, mode) {
  if (mode === 'companion') {
    if (/anxious|stress|worried/i.test(text)) return 'Stress Check-in';
    if (/sleep|tired|rest/i.test(text)) return 'Sleep Check-in';
    if (/mood|feeling|low|sad/i.test(text)) return 'Mood Check-in';
    return 'Daily Check-in';
  }
  if (/fever|ಜ್ವರ|bukhar/i.test(text)) return 'Fever Case';
  if (/pain|ನೋವು|dard|chest/i.test(text)) return 'Pain Assessment';
  if (/child|baby/i.test(text)) return 'Child Health';
  if (/payment|pay|emi/i.test(text)) return 'Payment Record';
  return 'Consultation';
}

/**
 * Sanitize text for safe HTML rendering.
 * @param {string} text
 * @returns {string}
 */
export function sanitize(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\n/g, '<br>');
}
