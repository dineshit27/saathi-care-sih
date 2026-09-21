import { Vitals, Patient } from '../types';

export interface TriageAiResult {
  summary: string;
  riskLevel: 'routine' | 'urgent' | 'emergency' | 'follow-up';
  riskFactors: string[];
  suggestedNextStep: string;
  questionsForClinician: string[];
  patientExplanation: string;
  safetyNotice: string;
  isAiGenerated?: boolean;
  engine?: string;
}

export async function runAiTriage(
  symptoms: string[],
  vitals: Vitals,
  patientInfo?: Partial<Patient>
): Promise<TriageAiResult> {
  try {
    const res = await fetch('/api/ai/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms, vitals, patientInfo })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend AI unavailable, running local clinical rule matrix:', err);
    // Local fallback
    const systolic = vitals.systolicBp || 0;
    const spo2 = vitals.spo2 || 99;
    const isEmergency = (systolic > 180 || spo2 < 90);
    const isUrgent = (systolic >= 140 || spo2 <= 94 || (vitals.temperature || 0) >= 102);

    const level: 'emergency' | 'urgent' | 'routine' = isEmergency ? 'emergency' : isUrgent ? 'urgent' : 'routine';

    return {
      summary: `Patient reports: ${symptoms.length > 0 ? symptoms.join(', ') : 'Routine review'}. Measured vitals: BP ${vitals.systolicBp || '--'}/${vitals.diastolicBp || '--'}, SpO2 ${vitals.spo2 || '--'}%.`,
      riskLevel: level,
      riskFactors: isEmergency
        ? ['Severe physiological derangement observed']
        : isUrgent
        ? ['Elevated clinical parameters requiring prompt Medical Officer consultation']
        : ['Vitals within stable operational bounds'],
      suggestedNextStep: isEmergency
        ? 'Immediate physician escalation and oxygen/stabilization protocol'
        : isUrgent
        ? 'Medical Officer consultation within 45 minutes; routine investigations'
        : 'Regular OPD queue consultation',
      questionsForClinician: [
        'Onset and progression of main complaint?',
        'Adherence to prescribed public dispensary therapies?',
        'Need for secondary level referral?'
      ],
      patientExplanation: isEmergency
        ? 'Please rest quietly. Our healthcare team is attending to you immediately.'
        : isUrgent
        ? 'Your vitals show you should be evaluated by the Medical Officer soon today.'
        : 'Your checkup details are recorded. You will see the doctor shortly.',
      safetyNotice: 'AI-assisted support — final decision remains with the healthcare professional.',
      isAiGenerated: false,
      engine: 'Client Clinical Rule Matrix (Offline Safe)'
    };
  }
}

export async function translateMedicalText(
  text: string,
  targetLanguage: string = 'mr',
  sourceLanguage: string = 'en'
): Promise<{ translatedText: string; safetyNotice: string }> {
  try {
    const res = await fetch('/api/ai/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLanguage, sourceLanguage })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      translatedText: text,
      safetyNotice: 'AI-assisted translation — verify important medical information with a healthcare professional.'
    };
  }
}

export async function generateReferralSummary(data: {
  patient: Partial<Patient>;
  clinicalNotes: string;
  fromFacility: { name: string };
  toFacility: { name: string };
  reason: string;
  provisionalDiagnosis: string;
}): Promise<{
  handoffSummary: string;
  keyInvestigationsNeeded: string[];
  continuityAlert: string;
  safetyNotice: string;
}> {
  try {
    const res = await fetch('/api/ai/referral-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      handoffSummary: `Patient ${data.patient.name || 'Citizen'} referred from ${data.fromFacility.name} to ${data.toFacility.name} for ${data.reason}. Provisional diagnosis: ${data.provisionalDiagnosis}.`,
      keyInvestigationsNeeded: ['Specialist clinical review', 'Confirmatory diagnostics'],
      continuityAlert: 'Ensure post-referral discharge report is recorded by frontline health worker.',
      safetyNotice: 'AI-assisted referral summary — final clinical handoff verification required by referring Medical Officer.'
    };
  }
}
