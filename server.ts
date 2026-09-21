import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Google GenAI Client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Saathi Care Core Public Health API',
    version: '1.0.0',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString()
  });
});

// Deterministic Triage Rule Engine (Medical safety fallback & baseline)
function runDeterministicTriage(symptoms: string[], vitals: {
  temperature?: number;
  pulse?: number;
  systolicBp?: number;
  diastolicBp?: number;
  spo2?: number;
  respiratoryRate?: number;
}) {
  const flags: string[] = [];
  let riskLevel: 'emergency' | 'urgent' | 'routine' | 'follow-up' = 'routine';

  const sText = symptoms.join(' ').toLowerCase();

  // Emergency criteria
  if (
    (vitals.spo2 && vitals.spo2 < 90) ||
    (vitals.systolicBp && vitals.systolicBp > 180) ||
    (vitals.diastolicBp && vitals.diastolicBp > 120) ||
    sText.includes('severe chest pain') ||
    sText.includes('unconscious') ||
    sText.includes('severe bleeding') ||
    sText.includes('gasping') ||
    sText.includes('seizure')
  ) {
    riskLevel = 'emergency';
    if (vitals.spo2 && vitals.spo2 < 90) flags.push(`Critical Hypoxemia (SpO2 ${vitals.spo2}%)`);
    if (vitals.systolicBp && vitals.systolicBp > 180) flags.push(`Hypertensive Crisis (BP ${vitals.systolicBp}/${vitals.diastolicBp})`);
    if (sText.includes('severe chest pain')) flags.push('Suspected acute cardiac or thoracic event');
  }
  // Urgent criteria
  else if (
    (vitals.spo2 && vitals.spo2 <= 94) ||
    (vitals.systolicBp && vitals.systolicBp >= 140) ||
    (vitals.diastolicBp && vitals.diastolicBp >= 90) ||
    (vitals.temperature && vitals.temperature >= 102) ||
    (vitals.pulse && (vitals.pulse > 115 || vitals.pulse < 50)) ||
    sText.includes('high fever') ||
    sText.includes('shortness of breath') ||
    sText.includes('abdominal pain') ||
    sText.includes('dehydration')
  ) {
    riskLevel = 'urgent';
    if (vitals.spo2 && vitals.spo2 <= 94) flags.push(`Suboptimal oxygenation (SpO2 ${vitals.spo2}%)`);
    if (vitals.systolicBp && vitals.systolicBp >= 140) flags.push(`Elevated blood pressure (${vitals.systolicBp}/${vitals.diastolicBp} mmHg)`);
    if (vitals.temperature && vitals.temperature >= 102) flags.push(`High pyrexia (${vitals.temperature}°F)`);
    if (sText.includes('shortness of breath')) flags.push('Respiratory distress noted');
  }

  return {
    summary: `Patient presents with ${symptoms.length > 0 ? symptoms.join(', ') : 'routine health complaints'}. Observed vitals: ${
      vitals.spo2 ? `SpO2: ${vitals.spo2}%, ` : ''
    }${vitals.systolicBp ? `BP: ${vitals.systolicBp}/${vitals.diastolicBp} mmHg, ` : ''}${
      vitals.temperature ? `Temp: ${vitals.temperature}°F` : 'Normal baseline'
    }.`,
    riskLevel,
    riskFactors: flags.length > 0 ? flags : ['No critical physiological instability detected on initial vitals'],
    suggestedNextStep: riskLevel === 'emergency'
      ? 'Immediate emergency stabilization and Medical Officer escalation at PHC/Sub-district Hospital.'
      : riskLevel === 'urgent'
      ? 'Priority clinical review by Medical Officer within 60 minutes; consider point-of-care diagnostics.'
      : 'Standard outpatient consultation queue; verify medication adherence and lifestyle factors.',
    questionsForClinician: [
      'Duration and progression of primary symptoms?',
      'Any known history of hypertension, diabetes, or coronary disease?',
      'Current adherence to prescribed public-health dispensations?'
    ],
    patientExplanation: riskLevel === 'emergency'
      ? 'Your readings need immediate attention by the doctor right away. Please sit calmly while our frontline worker brings the medical officer.'
      : riskLevel === 'urgent'
      ? 'Your readings show your body is under stress. The doctor will see you shortly for careful evaluation.'
      : 'Your symptoms have been logged. You are safely queued to see the doctor today.',
    safetyNotice: 'AI-assisted support — final decision remains with the healthcare professional.'
  };
}

// AI Assisted Digital Triage
app.post('/api/ai/triage', async (req, res) => {
  try {
    const { symptoms = [], vitals = {}, patientInfo = {} } = req.body;
    const ai = getGenAI();

    if (!ai) {
      const fallback = runDeterministicTriage(symptoms, vitals);
      return res.json({ ...fallback, isAiGenerated: false, engine: 'Clinical Rule Matrix (Offline/No-Key Fallback)' });
    }

    const prompt = `You are Saathi AI, an assistive public health triage copilot deployed in primary health centres (PHC) in rural Maharashtra, India.
CRITICAL SAFETY DIRECTIVE: You NEVER diagnose definitively or prescribe medication. You provide decision support for Frontline ASHA workers and Medical Officers.
Every output must emphasize: "AI-assisted — final decision remains with the healthcare professional."

Patient Information:
- Age: ${patientInfo.age || 'Unknown'}
- Gender: ${patientInfo.gender || 'Unknown'}
- Location / Village: ${patientInfo.village || 'Rural Village'}
- Known conditions: ${patientInfo.existingConditions?.join(', ') || 'None declared'}
- Reported symptoms: ${symptoms.join(', ') || 'General checkup'}
- Vitals Recorded:
  * Temperature: ${vitals.temperature || 'Not recorded'} °F
  * Pulse: ${vitals.pulse || 'Not recorded'} bpm
  * Blood Pressure: ${vitals.systolicBp ? `${vitals.systolicBp}/${vitals.diastolicBp} mmHg` : 'Not recorded'}
  * SpO2: ${vitals.spo2 ? `${vitals.spo2}%` : 'Not recorded'}
  * Respiratory Rate: ${vitals.respiratoryRate ? `${vitals.respiratoryRate}/min` : 'Not recorded'}
  * Weight: ${vitals.weight ? `${vitals.weight} kg` : 'Not recorded'}

Return ONLY a valid JSON object matching this schema:
{
  "summary": "Brief 1-2 sentence clinical summary of symptoms and vitals",
  "riskLevel": "emergency" | "urgent" | "routine" | "follow-up",
  "riskFactors": ["list of specific physiological risk flags or red flags"],
  "suggestedNextStep": "Operational guidance for the ASHA worker / PHC staff",
  "questionsForClinician": ["3 targeted questions for the doctor to investigate"],
  "patientExplanation": "Clear, reassuring explanation in simple layman English suitable for translation to Marathi/Hindi",
  "safetyNotice": "AI-assisted support — final decision remains with the healthcare professional."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty AI response');
    }

    const parsed = JSON.parse(text);
    return res.json({ ...parsed, isAiGenerated: true, engine: 'gemini-3.8-flash' });
  } catch (err: any) {
    console.error('AI Triage error:', err.message);
    const fallback = runDeterministicTriage(req.body.symptoms || [], req.body.vitals || {});
    return res.json({
      ...fallback,
      isAiGenerated: false,
      engine: 'Clinical Rule Matrix (Resilient Fallback)',
      fallbackReason: err.message
    });
  }
});

// AI Multilingual Translation
app.post('/api/ai/translate', async (req, res) => {
  try {
    const { text, targetLanguage = 'mr', sourceLanguage = 'en' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text required' });
    }

    const ai = getGenAI();
    if (!ai) {
      // Basic dictionary mapping for common public-health phrases if key unavailable
      return res.json({
        translatedText: text,
        sourceLanguage,
        targetLanguage,
        note: 'AI translation inactive without API key; showing original text.'
      });
    }

    const langMap: Record<string, string> = {
      mr: 'Marathi (मराठी) using natural conversational rural Maharashtra phrasing',
      hi: 'Hindi (हिंदी) using simple and respectful conversational phrasing',
      en: 'Standard clear English'
    };

    const targetDesc = langMap[targetLanguage] || targetLanguage;

    const prompt = `You are a medical translator for rural public health clinics in Maharashtra.
Translate the following healthcare communication accurately and empathetically from ${sourceLanguage} to ${targetDesc}.
Do not lose any clinical nuances. Keep the tone warm, respectful, and easily understood by rural villagers.
Include the required disclaimer at the end: "AI-assisted translation — verify important medical information with a healthcare professional."

Input text:
"""${text}"""

Return a JSON with:
{
  "translatedText": "the translation",
  "targetLanguage": "${targetLanguage}",
  "safetyNotice": "AI-assisted translation — verify important medical information with a healthcare professional."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ ...parsed, isAiGenerated: true });
  } catch (err: any) {
    console.error('Translation error:', err.message);
    return res.json({
      translatedText: req.body.text,
      targetLanguage: req.body.targetLanguage,
      error: 'Translation fallback engaged',
      safetyNotice: 'AI-assisted translation — verify important medical information with a healthcare professional.'
    });
  }
});

// AI Referral Handoff Summary
app.post('/api/ai/referral-summary', async (req, res) => {
  try {
    const { patient, clinicalNotes, fromFacility, toFacility, reason, provisionalDiagnosis } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        handoffSummary: `Patient ${patient?.name || 'Unknown'} (${patient?.age || 'N/A'}y/${patient?.gender || 'N/A'}) referred from ${fromFacility?.name || 'PHC'} to ${toFacility?.name || 'District Hospital'}. Reason: ${reason || 'Specialist Evaluation'}. Provisional Assessment: ${provisionalDiagnosis || 'Under Investigation'}.`,
        keyInvestigationsNeeded: ['Complete blood count', 'Diagnostic imaging if indicated'],
        continuityAlert: 'Ensure diagnostic reports and specialist discharge notes are linked back to originating PHC for ASHA follow-up.',
        isAiGenerated: false
      });
    }

    const prompt = `Generate a structured Public Health Inter-Facility Referral Clinical Handoff Brief for the District Hospital in Maharashtra.
Originating Facility: ${fromFacility?.name || 'Rural PHC'}
Destination Facility: ${toFacility?.name || 'District Hospital'}
Patient: ${patient?.name}, ${patient?.age} yrs, ${patient?.gender}, Village: ${patient?.village}
Primary Referral Reason: ${reason}
Provisional Clinical Diagnosis: ${provisionalDiagnosis || 'Under Investigation'}
Doctor's Clinical Notes: ${clinicalNotes || 'None provided'}

Return JSON:
{
  "handoffSummary": "Concise 3-sentence clinical handoff summary for the receiving specialist",
  "keyInvestigationsNeeded": ["Recommended tests receiving hospital should prioritize"],
  "continuityAlert": "Specific instruction for post-referral community follow-up by the village ASHA worker",
  "safetyNotice": "AI-assisted referral summary — final clinical handoff verification required by referring Medical Officer."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ ...parsed, isAiGenerated: true });
  } catch (err: any) {
    return res.json({
      handoffSummary: `Referral summary for ${req.body.patient?.name || 'Patient'} to ${req.body.toFacility?.name || 'Specialist Facility'}.`,
      keyInvestigationsNeeded: ['Specialist review', 'Relevant diagnostics'],
      continuityAlert: 'Ensure ASHA follow-up upon discharge.',
      isAiGenerated: false
    });
  }
});

// Configure Vite middleware or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Saathi Care Public Health Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
