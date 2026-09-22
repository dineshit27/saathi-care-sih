import { Router, Response } from 'express';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';
import { getCollectionDocs, getDocById, setDocument, updateDocument } from '../dbHelper';

export const patientsRouter = Router();

// GET /api/patients
patientsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const patients = await getCollectionDocs('patients');
    res.json({ success: true, count: patients.length, data: patients });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch patients' }
    });
  }
});

// GET /api/patients/:id
patientsRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const patient = await getDocById('patients', req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Patient with ID '${req.params.id}' not found` }
      });
    }
    res.json({ success: true, data: patient });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch patient' }
    });
  }
});

// POST /api/patients
patientsRouter.post('/', requireRole('asha', 'doctor', 'facility'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const patientData = req.body;

    // Server-side validation
    if (!patientData.name || typeof patientData.name !== 'string' || patientData.name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Patient name must be at least 2 characters long.' }
      });
    }

    const age = Number(patientData.age);
    if (isNaN(age) || age < 0 || age > 130) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Patient age must be a valid number between 0 and 130.' }
      });
    }

    const validGenders = ['Female', 'Male', 'Other'];
    if (!patientData.gender || !validGenders.includes(patientData.gender)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: "Gender must be one of 'Female', 'Male', or 'Other'." }
      });
    }

    if (!patientData.village || typeof patientData.village !== 'string' || patientData.village.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Patient village is required.' }
      });
    }

    const newId = patientData.id || `pat-${Date.now().toString().slice(-6)}`;

    // Duplicate check: if an existing patient with exact same ID exists
    const existing = await getDocById('patients', newId);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_RECORD', message: 'Patient record with this ID already exists.' }
      });
    }

    const fullPatient = {
      ...patientData,
      id: newId,
      name: patientData.name.trim(),
      age,
      gender: patientData.gender,
      village: patientData.village.trim(),
      registeredAt: patientData.registeredAt || new Date().toISOString(),
      registeredByRole: req.user?.role || 'asha',
      createdBy: req.user?.name || 'Healthcare Worker',
      careContinuityScore: patientData.careContinuityScore || {
        completedSteps: 1,
        totalSteps: 5,
        lastMilestone: 'Registration Completed with Digital Consent'
      }
    };

    const saved = await setDocument('patients', newId, fullPatient);

    // Create initial timeline event
    const eventId = `evt-${Date.now()}`;
    await setDocument('healthRecords', eventId, {
      id: eventId,
      patientId: newId,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      facilityId: req.user?.facilityId || 'fac-phc-shirur',
      facilityName: 'Shirur Primary Health Centre (PHC)',
      providerName: req.user?.name || 'Frontline Worker',
      providerRole: req.user?.role || 'ASHA Frontline Worker',
      eventType: 'registration',
      title: 'Patient Registered & Digital Consent Stored',
      notes: `Registered from Village ${saved.village}. Emergency Contact: ${saved.emergencyContact?.name || 'Guardian'}.`,
      badgeType: 'default'
    });

    // Create Audit Log (Server-side authored)
    const logId = `log-${Date.now()}`;
    await setDocument('auditLogs', logId, {
      id: logId,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      userName: req.user?.name || 'Frontline Worker',
      userRole: req.user?.role || 'asha',
      action: 'Patient Registered',
      entityType: 'Patient',
      entityId: newId,
      facilityName: 'Shirur PHC',
      details: `Registered ${saved.name} (${saved.age}y, ${saved.gender}) from ${saved.village}`
    });

    res.status(201).json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to register patient' }
    });
  }
});

// PATCH /api/patients/:id/vitals
patientsRouter.patch('/:id/vitals', requireRole('asha', 'doctor', 'facility'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { vitals, riskLevel, symptoms } = req.body;
    const patient = await getDocById('patients', req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Patient not found' }
      });
    }

    // Validate vitals if provided
    if (vitals) {
      if (vitals.systolicBp && (vitals.systolicBp < 40 || vitals.systolicBp > 300)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Systolic BP must be between 40 and 300 mmHg.' }
        });
      }
      if (vitals.spo2 && (vitals.spo2 < 50 || vitals.spo2 > 100)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'SpO2 must be between 50% and 100%.' }
        });
      }
    }

    const updated = await updateDocument('patients', req.params.id, {
      vitals,
      riskLevel: riskLevel || patient.riskLevel,
      currentSymptoms: symptoms || patient.currentSymptoms,
      updatedBy: req.user?.name || 'Frontline Worker',
      careContinuityScore: {
        ...(patient.careContinuityScore || { completedSteps: 1, totalSteps: 5 }),
        completedSteps: Math.max(patient.careContinuityScore?.completedSteps || 1, 2),
        lastMilestone: 'Assisted Digital Triage Completed'
      }
    });

    // Add Timeline Event
    const eventId = `evt-${Date.now()}`;
    await setDocument('healthRecords', eventId, {
      id: eventId,
      patientId: req.params.id,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      facilityId: req.user?.facilityId || 'fac-phc-shirur',
      facilityName: 'Shirur Primary Health Centre',
      providerName: req.user?.name || 'Frontline Worker',
      providerRole: req.user?.role || 'ASHA Frontline Worker',
      eventType: 'triage',
      title: `Digital Triage Completed — ${(riskLevel || 'routine').toUpperCase()}`,
      notes: `Vitals recorded: BP ${vitals?.systolicBp || '--'}/${vitals?.diastolicBp || '--'}, SpO2 ${vitals?.spo2 || '--'}%. Symptoms: ${(symptoms || []).join(', ')}.`,
      vitals,
      badgeType: riskLevel === 'emergency' ? 'emergency' : riskLevel === 'urgent' ? 'urgent' : 'default'
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to update patient vitals' }
    });
  }
});

