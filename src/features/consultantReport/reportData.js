import { FIELD_LABELS } from '../../utils/constants.js';

function valueOrFallback(value, fallback = 'Not captured') {
  const text = String(value || '').trim();
  return text || fallback;
}

function truncate(text, max = 170) {
  const value = String(text || '').trim();
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max - 3).trim()}...` : value;
}

export function buildConsultantReportData({ session, extracted, generatedAt = new Date().toISOString() }) {
  const data = extracted || {};
  const patientName = valueOrFallback(data.patient_name);
  const consultationReason = valueOrFallback(data.consultation_reason || data.chief_complaint);

  const patientInfoRows = [
    ['Patient Name', valueOrFallback(data.patient_name)],
    ['Age', valueOrFallback(data.patient_age)],
    ['Gender', valueOrFallback(data.patient_gender)],
    ['Consultation Reason', consultationReason],
  ];

  const clinicalRows = [
    ['Chief Complaint', valueOrFallback(data.chief_complaint)],
    ['Symptoms', valueOrFallback(data.symptoms)],
    ['Duration', valueOrFallback(data.duration)],
    ['Severity', valueOrFallback(data.severity)],
    ['Past History', valueOrFallback(data.past_history)],
    ['Medications', valueOrFallback(data.medications)],
    ['Allergies', valueOrFallback(data.allergies)],
  ];

  const assessmentRows = [
    ['Diagnosis Hint', valueOrFallback(data.diagnosis_hint)],
    ['Recommended Action', valueOrFallback(data.recommended_action)],
    ['Follow-up', valueOrFallback(data.follow_up)],
    ['Language', valueOrFallback(data.language_detected)],
    ['Intent', valueOrFallback(data.intent)],
  ];

  const conversationHighlights = (session?.messages || [])
    .filter((message) => String(message?.content || '').trim())
    .slice(-4)
    .map((message) => `${message.role === 'ai' ? 'AI' : 'Patient'}: ${truncate(message.content)}`);

  const completedFields = Object.entries(data)
    .filter(([, value]) => String(value || '').trim())
    .map(([key, value]) => `${FIELD_LABELS[key] || key}: ${value}`);

  const summary = [
    `${patientName} was consulted for ${consultationReason.toLowerCase()}.`,
    data.symptoms ? `Symptoms captured: ${data.symptoms}.` : '',
    data.duration ? `Duration: ${data.duration}.` : '',
    data.recommended_action ? `Next step: ${data.recommended_action}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    title: session?.title || 'Consultation Report',
    generatedAt,
    patientName,
    consultationReason,
    summary: summary || 'A structured consultation record was prepared from this session.',
    patientInfoRows,
    clinicalRows,
    assessmentRows,
    completedFields,
    conversationHighlights,
    disclaimer: 'This report is AI-assisted documentation and should be reviewed by a qualified healthcare professional.',
  };
}
