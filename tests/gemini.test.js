import test from 'node:test';
import assert from 'node:assert/strict';
import { callGemini, extractGeminiText } from '../src/api/gemini.js';

test('extractGeminiText joins multiple response parts', () => {
  const text = extractGeminiText({
    content: {
      parts: [{ text: 'I hear you, ' }, { text: 'and I can help.' }],
    },
  });

  assert.equal(text, 'I hear you, and I can help.');
});

test('callGemini retries once when structured output is cut before the JSON separator', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;

  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) {
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: 'MAX_TOKENS',
              content: {
                parts: [{ text: "I hear you, and I'm" }],
              },
            },
          ],
        }),
      };
    }

    return {
      ok: true,
      json: async () => ({
        candidates: [
          {
            finishReason: 'STOP',
            content: {
              parts: [
                {
                  text: " here to help.\n---COMPANION_JSON---\n{\"mood\":\"\",\"stress_level\":\"\",\"sleep_quality\":\"\",\"habits_mentioned\":[],\"distress\":false}",
                },
              ],
            },
          },
        ],
      }),
    };
  };

  try {
    const text = await callGemini('test-key', 'system prompt', [{ role: 'user', content: 'hello' }], {
      requiredSeparator: '---COMPANION_JSON---',
    });

    assert.equal(calls, 2);
    assert.ok(text.includes("I hear you, and I'm here to help."));
    assert.ok(text.includes('---COMPANION_JSON---'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
