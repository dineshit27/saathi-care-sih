import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getCollectionDocs, getDocById, setDocument, updateDocument } from '../dbHelper';

export const patientsRouter = Router();

// GET /api/patients
patientsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const patients = await getCollectionDocs('patients');
    res.json({ success: true, count: patients.length, data: patients });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/patients/:id
patientsRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const patient = await getDocById('patients', req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }
    res.json({ success: true, data: patient });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/patients
patientsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const patientData = req.body;
    const newId = patientData.id || `pat-${Date.now().toString().slice(-6)}`;
    const fullPatient = {
      ...patientData,
      id: newId,
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

    // Create Audit Log
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
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/patients/:id/vitals
patientsRouter.patch('/:id/vitals', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { vitals, riskLevel, symptoms } = req.body;
    const patient = await getDocById('patients', req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
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
    res.status(500).json({ success: false, error: error.message });
  }
});
