import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCompanionHealthReport } from '../src/features/companionReport/reportAnalysis.js';

test('companion report highlights poor sleep, high stress, and missed medication', () => {
  const report = buildCompanionHealthReport({
    session: {
      title: 'Stress Check-in',
      messages: [
        { role: 'user', content: 'I have been very stressed and anxious today.' },
        { role: 'ai', content: 'Tell me about your sleep.' },
        { role: 'user', content: 'I slept only 4 hours, forgot my medication, and did not drink enough water.' },
      ],
    },
    generatedAt: '2026-03-18T08:00:00.000Z',
  });

  assert.equal(report.overallStatus, 'Needs attention');
  assert.equal(report.sleep.quality, 'poor');
  assert.equal(report.stress.level, 'high');
  assert.ok(report.improvementSteps.some((step) => /sleep|bedtime/i.test(step)));
  assert.ok(report.improvementSteps.some((step) => /medicine|pill|medication/i.test(step)));
  assert.ok(report.personalizedTips.some((tip) => /medication|missed doses|routine cue/i.test(tip)));
});

test('companion report preserves healthy momentum when routines are positive', () => {
  const report = buildCompanionHealthReport({
    session: {
      title: 'Daily Check-in',
      messages: [
        { role: 'user', content: 'Feeling good today. I slept well for 8 hours.' },
        { role: 'ai', content: 'How are your daily habits?' },
        { role: 'user', content: 'I had breakfast, drank water, and went for a walk this morning.' },
      ],
    },
    companionSnapshot: {
      todayMood: 'good',
      sleepAvg: 8,
      stressLevel: 24,
      habits: [
        { id: 'water', done: true, streak: 3 },
        { id: 'walk', done: true, streak: 4 },
        { id: 'meds', done: false, streak: 0 },
        { id: 'sleep', done: true, streak: 2 },
        { id: 'food', done: true, streak: 2 },
      ],
    },
    generatedAt: '2026-03-18T08:00:00.000Z',
  });

  assert.equal(report.overallStatus, 'Stable with healthy momentum');
  assert.equal(report.sleep.quality, 'good');
  assert.equal(report.stress.level, 'low');
  assert.ok(report.strengths.some((item) => /walking|walk/i.test(item) || /habit/i.test(item)));
  assert.ok(report.keyFindings.some((item) => /4 of 5|tracked lifestyle habits/i.test(item)));
});
