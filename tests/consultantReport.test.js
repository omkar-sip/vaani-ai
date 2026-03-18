import test from 'node:test';
import assert from 'node:assert/strict';
import { buildConsultantReportData } from '../src/features/consultantReport/reportData.js';

test('consultant report data includes patient identity, consultation reason, and plan rows', () => {
  const report = buildConsultantReportData({
    session: {
      title: 'Fever Case',
      messages: [
        { role: 'user', content: 'My name is Meera. I have had fever and headache for 3 days.' },
        { role: 'ai', content: 'Any allergies or medicines?' },
        { role: 'user', content: 'No allergies. I took paracetamol yesterday.' },
      ],
    },
    extracted: {
      patient_name: 'Meera',
      patient_age: '29',
      patient_gender: 'Female',
      consultation_reason: 'Fever and headache',
      chief_complaint: 'Fever and headache',
      symptoms: 'Fever, headache',
      duration: '3 days',
      severity: 'Moderate',
      medications: 'Paracetamol',
      allergies: 'None known',
      diagnosis_hint: 'Possible viral fever',
      recommended_action: 'Hydrate, rest, and visit the PHC if fever continues.',
      follow_up: 'Review in 24 to 48 hours if not improving.',
      language_detected: 'en',
      intent: 'symptom_assessment',
    },
    generatedAt: '2026-03-18T08:00:00.000Z',
  });

  assert.equal(report.patientName, 'Meera');
  assert.equal(report.consultationReason, 'Fever and headache');
  assert.ok(report.patientInfoRows.some(([label, value]) => label === 'Patient Name' && value === 'Meera'));
  assert.ok(report.assessmentRows.some(([label, value]) => label === 'Recommended Action' && /PHC/i.test(value)));
  assert.ok(report.conversationHighlights.some((line) => /Patient:|AI:/i.test(line)));
});
