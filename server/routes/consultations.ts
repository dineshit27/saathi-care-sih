import { Router, Response } from 'express';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';
import { getCollectionDocs, setDocument } from '../dbHelper';

export const consultationsRouter = Router();

// GET /api/consultations
consultationsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const consultations = await getCollectionDocs('consultations');
    res.json({ success: true, count: consultations.length, data: consultations });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'CONSULTATIONS_FETCH_FAILED', message: error.message || 'Failed to retrieve consultations' }
    });
  }
});

// POST /api/consultations - Restricted to Medical Officers (Doctors)
consultationsRouter.post(
  '/',
  requireRole('doctor'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = req.body;
      if (!data || !data.patientId) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_FAILED', message: 'Consultation record requires patientId.' }
        });
      }

      const newId = `cons-${Date.now()}`;
      const consultation = {
        ...data,
        id: newId,
        doctorName: req.user?.name || data.doctorName || 'Dr. Anand Kulkarni',
        createdAt: new Date().toISOString(),
        createdBy: req.user?.name || 'Doctor',
        updatedAt: new Date().toISOString()
      };

      const saved = await setDocument('consultations', newId, consultation);

      // Add Timeline Event
      const evtId = `evt-${Date.now()}`;
      await setDocument('healthRecords', evtId, {
        id: evtId,
        patientId: data.patientId,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        facilityId: req.user?.facilityId || 'fac-phc-shirur',
        facilityName: 'Shirur Primary Health Centre (PHC)',
        providerName: consultation.doctorName,
        providerRole: 'Medical Officer',
        eventType: 'consultation',
        title: `Consultation Completed: ${data.diagnosis || 'Clinical Review'}`,
        notes: data.clinicalNotes || `Prescriptions: ${(data.prescriptions || []).map((p: any) => p.medicineName).join(', ')}`,
        badgeType: 'success'
      });

      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'CONSULTATION_CREATION_FAILED', message: error.message || 'Failed to record consultation' }
      });
    }
  }
);

