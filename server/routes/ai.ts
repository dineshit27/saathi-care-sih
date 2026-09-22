import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

export const aiRouter = Router();

let aiClient: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// POST /api/ai/triage
aiRouter.post('/triage', async (req: Request, res: Response) => {
  try {
    const { vitals, symptoms, patientAge, patientGender, conditions } = req.body;
    const ai = getGeminiAI();

    if (ai) {
      const prompt = `You are Saathi Care's clinical AI assistant for Indian Primary Health Centres (PHC) and frontline ASHA workers.
Analyze the following patient data and provide clinical triage:
- Age: ${patientAge || 45} (${patientGender || 'Unknown'})
- Symptoms: ${(symptoms || []).join(', ')}
- Vitals: BP ${vitals?.systolicBp || 120}/${vitals?.diastolicBp || 80}, Pulse ${vitals?.pulse || 72}, SpO2 ${vitals?.spo2 || 98}%, Temp ${vitals?.temperature || 98.6}°F
- Known Conditions: ${(conditions || []).join(', ')}

Return a JSON object with:
{
  "riskLevel": "routine" | "urgent" | "emergency",
  "urgencyScore": number (1 to 10),
  "primaryAssessment": "string",
  "redFlags": ["string"],
  "recommendedAction": "string",
  "suggestedTests": ["string"],
  "ashaGuidance": "string"
}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          }
        });

        if (response.text) {
          return res.json({ success: true, ...JSON.parse(response.text) });
        }
      } catch (geminiErr: any) {
        console.warn('[AI Triage] Gemini API warning, falling back to rule matrix:', geminiErr?.message || geminiErr);
      }
    }

    // Algorithmic clinical fallback if GEMINI_API_KEY is not set
    const systolic = Number(vitals?.systolicBp || 120);
    const diastolic = Number(vitals?.diastolicBp || 80);
    const spo2 = Number(vitals?.spo2 || 98);

    let riskLevel: 'routine' | 'urgent' | 'emergency' = 'routine';
    let urgencyScore = 3;
    const redFlags: string[] = [];

    if (systolic >= 160 || diastolic >= 100 || spo2 < 92) {
      riskLevel = 'emergency';
      urgencyScore = 9;
      if (systolic >= 160) redFlags.push('Severe Hypertension Crisis (BP ≥ 160/100)');
      if (spo2 < 92) redFlags.push('Hypoxemia (SpO2 < 92%)');
    } else if (systolic >= 140 || diastolic >= 90 || spo2 < 95 || (symptoms && symptoms.length > 2)) {
      riskLevel = 'urgent';
      urgencyScore = 6;
      if (systolic >= 140) redFlags.push('Elevated Blood Pressure Stage 2');
    }

    res.json({
      success: true,
      riskLevel,
      urgencyScore,
      primaryAssessment: riskLevel === 'urgent'
        ? 'Hypertensive strain with neurological/ocular symptom correlation requiring medical officer titration.'
        : 'Routine primary care examination indicated.',
      redFlags: redFlags.length > 0 ? redFlags : ['No immediate life-threatening vitals identified'],
      recommendedAction: riskLevel === 'urgent'
        ? 'Medical Officer consultation within 20 mins; priority referral to Secondary Hospital if visual symptoms persist.'
        : 'Standard outpatient queue consultation.',
      suggestedTests: ['Point-of-care 12-Lead ECG', 'Random Blood Glucose', 'Renal Function Profile'],
      ashaGuidance: 'Ensure patient rests in seated position. Re-verify BP after 10 minutes. Prepare digital transfer pass.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ai/translate
aiRouter.post('/translate', async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage } = req.body;
    const ai = getGeminiAI();

    if (ai && text) {
      try {
        const prompt = `Translate this Indian healthcare clinical message accurately into ${targetLanguage === 'mr' ? 'Marathi' : targetLanguage === 'hi' ? 'Hindi' : 'English'}. Keep medical terminology understandable for rural patients. Text: "${text}"`;
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });

        return res.json({ success: true, translatedText: response.text?.trim() });
      } catch (geminiErr: any) {
        console.warn('[AI Translate] Gemini warning:', geminiErr?.message || geminiErr);
      }
    }

    res.json({ success: true, translatedText: text });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ai/referral-summary
aiRouter.post('/referral-summary', async (req: Request, res: Response) => {
  try {
    const { patient, vitals, diagnosis, reason, destination } = req.body;
    const ai = getGeminiAI();

    if (ai) {
      try {
        const prompt = `Generate an executive clinical handoff summary for an inter-facility referral from a Primary Health Centre to ${destination}:
Patient: ${patient?.name}, ${patient?.age}y ${patient?.gender}, Village ${patient?.village}
Diagnosis: ${diagnosis}
Reason: ${reason}
Vitals: BP ${vitals?.systolicBp}/${vitals?.diastolicBp}, SpO2 ${vitals?.spo2}%, Pulse ${vitals?.pulse}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });

        return res.json({ success: true, summary: response.text?.trim() });
      } catch (geminiErr: any) {
        console.warn('[AI Referral Summary] Gemini warning:', geminiErr?.message || geminiErr);
      }
    }

    // Default clinical summary
    res.json({
      success: true,
      summary: `Patient ${patient?.name || 'Patient'} (${patient?.age || 45}y, ${patient?.gender || 'M'}) referred to ${destination || 'District Hospital'} for ${diagnosis || 'further evaluation'}. Reason: ${reason || 'Specialist escalation'}. Vitals stable but require tertiary monitoring.`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
