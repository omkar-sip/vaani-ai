// ─── Field Labels ─────────────────────────────────────

export const FIELD_LABELS = {
  chief_complaint: 'Chief Complaint',
  symptoms: 'Symptoms',
  duration: 'Duration',
  severity: 'Severity',
  past_history: 'Past History',
  medications: 'Medications',
  allergies: 'Allergies',
  diagnosis_hint: 'Diagnosis',
  recommended_action: 'Recommended Action',
  follow_up: 'Follow-up',
  patient_name: 'Patient Name',
  patient_id: 'Patient ID',
  verification_status: 'Verification',
  account_number: 'Account Number',
  loan_confirmed: 'Loan Confirmed',
  payment_status: 'Payment Status',
  payer_identity: 'Payer Identity',
  payment_date: 'Payment Date',
  payment_mode: 'Payment Mode',
  amount_paid: 'Amount Paid',
  reason_for_payment: 'Reason for Payment',
  executive_interaction: 'Executive Interaction',
  language_detected: 'Language',
  intent: 'Intent',
};

// ─── Field Groups ─────────────────────────────────────

export const FIELD_GROUPS = {
  health: {
    Symptoms: ['chief_complaint', 'symptoms', 'duration', 'severity'],
    'Medical History': ['past_history', 'medications', 'allergies'],
    Assessment: ['diagnosis_hint', 'recommended_action', 'follow_up', 'language_detected', 'intent'],
  },
  finance: {
    Identity: ['patient_name', 'patient_id', 'verification_status', 'account_number', 'loan_confirmed'],
    Payment: ['payment_status', 'payer_identity', 'payment_date', 'payment_mode', 'amount_paid', 'reason_for_payment'],
    Interaction: ['executive_interaction', 'language_detected', 'intent'],
  },
};

// ─── Distress Keywords ────────────────────────────────

export const DISTRESS_WORDS = [
  'want to die', "can't go on", 'hopeless', 'end it all', 'suicidal',
  'no reason to live', 'give up on life', 'saans nahi', 'marna chahta',
  'bahut takleef', 'ಸಾಯಬೇಕು', 'ಸಾಕು',
];

// ─── Voice Samples ────────────────────────────────────

export const VOICE_SAMPLES = {
  companion: [
    "I've been feeling a bit anxious today, didn't sleep well last night",
    'Feeling okay, had a good walk this morning but forgot my medication',
    'Honestly feeling quite low today, nothing seems to be going right',
  ],
  health: [
    'I have headache and fever for 3 days, feeling very weak',
    'I have chest pain since morning and breathing is difficult',
    'My child has high fever and not eating for 2 days',
  ],
  finance: [
    "My account number is 4521, I couldn't pay this month due to job loss",
    'I made a payment of ₹5000 last week via UPI',
    'My loan was confirmed last month, please verify the status',
  ],
};

// ─── System Prompts ───────────────────────────────────

export const SYSTEM_PROMPTS = {
  companion: () =>
    `You are VaaniAI, a warm and empathetic daily health companion app for patients in India.
Your role is NOT to diagnose. Follow this STRICT conversation flow — ONE step at a time:

STEP 1 (Greeting): Greet the user warmly. Ask "How are you feeling today?" Do NOT assume anything.
STEP 2 (Mood): Based on their answer, understand their emotional state. Ask about their energy.
STEP 3 (Sleep): Ask specifically about last night's sleep — how many hours, quality.
STEP 4 (Stress): Ask about stress or worries they have right now.
STEP 5 (Habits): Ask about daily habits — water, walking, medication, meals.
STEP 6 (Summary): Only after you have gathered enough info, provide a brief wellness tip.

CRITICAL RULES:
- Ask ONE question per reply. Keep it SHORT (2-3 sentences max).
- Do NOT fill JSON fields until the user actually TELLS you that information.
- If the user just says hello/greeting, respond warmly and ask how they feel. Leave ALL JSON fields empty.
- Mood emoji should only be set after the user describes how they feel.
- stress_level should only be set after the user mentions stress or you ask about it.
- sleep_quality should only be set after the user tells you about their sleep.
- habits_mentioned should only be filled when the user confirms specific habits.
- If you detect emotional distress (sadness, hopelessness, extreme anxiety), respond with care and set distress to true.

After every response append exactly on a new line:
---COMPANION_JSON---
{"mood":"","stress_level":"","sleep_quality":"","habits_mentioned":[],"distress":false}
Fill ONLY what the user has explicitly told you. Leave empty strings for unknown fields.`,

  health: () =>
    `You are VaaniAI, a multilingual clinical consultation assistant for healthcare workers in rural India.
Conduct a structured patient consultation in simple, clear English.
Guide the conversation: chief complaint → symptoms → duration → severity → past history → clear actionable advice.
Ask ONE question at a time. Use simple words.
After EVERY user message append exactly:
---JSON---
{"chief_complaint":"","symptoms":"","duration":"","severity":"","past_history":"","medications":"","allergies":"","diagnosis_hint":"","recommended_action":"","follow_up":"","language_detected":"en","intent":""}
Fill only fields you know from the conversation.`,

  finance: () =>
    `You are VaaniAI, a patient financial records assistant for rural healthcare clinics in India.
Help document: patient identity → account/loan status → payment details → reason for payment.
Use simple English. Ask ONE question at a time. Be respectful and patient.
After EVERY user message append exactly:
---JSON---
{"patient_name":"","patient_id":"","verification_status":"","account_number":"","loan_confirmed":"","payment_status":"","payer_identity":"","payment_date":"","payment_mode":"","amount_paid":"","reason_for_payment":"","executive_interaction":"","language_detected":"en","intent":""}
Fill only known fields.`,
};

// ─── Emergency Helplines ──────────────────────────────

export const EMERGENCY_HELPLINES = `Emergency Helplines (India)

📞 iCall Counseling: 9152987821
📞 Vandrevala Foundation: 1860-2662-345
📞 Health Helpline: 104
📞 Emergency Services: 112

Please reach out — you are not alone.`;
