import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getCollectionDocs, setDocument, updateDocument } from '../dbHelper';

export const appointmentsRouter = Router();

// GET /api/appointments
appointmentsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const appointments = await getCollectionDocs('appointments');
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/appointments
appointmentsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    const newId = `apt-${Date.now()}`;
    const appointment = {
      ...data,
      id: newId,
      status: data.status || 'scheduled',
      createdAt: new Date().toISOString(),
      createdBy: req.user?.name || 'Staff'
    };

    const saved = await setDocument('appointments', newId, appointment);

    // Timeline event
    const evtId = `evt-${Date.now()}`;
    await setDocument('healthRecords', evtId, {
      id: evtId,
      patientId: data.patientId,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      facilityId: data.facilityId,
      facilityName: data.facilityName,
      providerName: req.user?.name || 'Scheduling Desk',
      providerRole: 'Facility Desk',
      eventType: 'appointment',
      title: `Specialist Appointment Confirmed: ${data.department || 'Clinical Speciality'}`,
      notes: `Scheduled for ${data.date} at ${data.time}. Provider: ${data.doctorName || 'Assigned Specialist'}.`,
      badgeType: 'success'
    });

    res.status(201).json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
