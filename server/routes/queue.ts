import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getCollectionDocs, getDocById, setDocument, updateDocument } from '../dbHelper';

export const queueRouter = Router();

// GET /api/queue
queueRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const queue = await getCollectionDocs('queueEntries');
    res.json({ success: true, count: queue.length, data: queue });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/queue
queueRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { patientId, doctorId } = req.body;
    const patient = await getDocById('patients', patientId);
    const allQueue = await getCollectionDocs('queueEntries');
    const tokenNumber = `A00${allQueue.length + 1}`;
    const newId = `q-${Date.now()}`;

    const queueEntry = {
      id: newId,
      tokenNumber,
      patientId,
      patientName: patient?.name || 'Patient',
      patientAge: patient?.age || 35,
      patientGender: patient?.gender || 'Other',
      patientVillage: patient?.village || 'Local Village',
      facilityId: req.user?.facilityId || 'fac-phc-shirur',
      facilityName: 'Shirur Primary Health Centre (PHC)',
      doctorId: doctorId || 'doc-001',
      doctorName: 'Dr. Anand Kulkarni',
      status: 'waiting',
      priority: patient?.riskLevel || 'routine',
      joinedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      estimatedWaitMinutes: (allQueue.filter((q: any) => q.status === 'waiting').length + 1) * 10,
      createdBy: req.user?.name || 'Frontline Worker'
    };

    const saved = await setDocument('queueEntries', newId, queueEntry);

    // Timeline event
    const evtId = `evt-${Date.now()}`;
    await setDocument('healthRecords', evtId, {
      id: evtId,
      patientId,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      facilityId: queueEntry.facilityId,
      facilityName: queueEntry.facilityName,
      providerName: 'Desk Dispatcher',
      providerRole: 'System Queue',
      eventType: 'appointment',
      title: `Added to Consultation Queue (#${tokenNumber})`,
      notes: `Joined consultation queue for Medical Officer review at ${queueEntry.facilityName}.`,
      badgeType: 'default'
    });

    // Send Notification to Doctor and Patient
    const notifId1 = `notif-${Date.now()}-1`;
    await setDocument('notifications', notifId1, {
      id: notifId1,
      recipientRole: 'doctor',
      title: 'New Queue Arrival',
      message: `${queueEntry.patientName} (#${tokenNumber}) queued for consultation.`,
      type: 'appointment',
      read: false,
      timestamp: 'Just now'
    });

    res.status(201).json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/queue/:id
queueRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    const entry = await getDocById('queueEntries', req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Queue entry not found' });
    }

    const updated = await updateDocument('queueEntries', req.params.id, {
      status,
      updatedBy: req.user?.name || 'Medical Officer'
    });

    if (status === 'completed') {
      const patient = await getDocById('patients', entry.patientId);
      if (patient) {
        await updateDocument('patients', entry.patientId, {
          careContinuityScore: {
            ...(patient.careContinuityScore || { completedSteps: 2, totalSteps: 5 }),
            completedSteps: Math.max(patient.careContinuityScore?.completedSteps || 2, 3),
            lastMilestone: 'Doctor Consultation Completed'
          }
        });
      }
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
