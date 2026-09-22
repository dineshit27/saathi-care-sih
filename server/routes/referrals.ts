import { Router, Response } from 'express';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';
import { getCollectionDocs, getDocById, setDocument, updateDocument } from '../dbHelper';

export const referralsRouter = Router();

// GET /api/referrals
referralsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const referrals = await getCollectionDocs('referrals');
    res.json({ success: true, count: referrals.length, data: referrals });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch referrals' }
    });
  }
});

// POST /api/referrals
referralsRouter.post('/', requireRole('doctor', 'facility', 'asha'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;

    if (!data.patientId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'patientId is required for referral creation.' }
      });
    }

    if (!data.toFacilityName && !data.toFacilityId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Target referral destination facility is required.' }
      });
    }

    const patient = await getDocById('patients', data.patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Patient with ID '${data.patientId}' does not exist.` }
      });
    }

    const refId = data.id || `REF-2026-MH-${Math.floor(1000 + Math.random() * 9000)}`;
    const referral = {
      ...data,
      id: refId,
      patientName: data.patientName || patient.name,
      patientAge: data.patientAge || patient.age,
      patientGender: data.patientGender || patient.gender,
      patientVillage: data.patientVillage || patient.village,
      status: data.status || 'sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user?.name || 'Doctor'
    };

    const saved = await setDocument('referrals', refId, referral);

    // Update patient care continuity score
    await updateDocument('patients', referral.patientId, {
      careContinuityScore: {
        ...(patient.careContinuityScore || { completedSteps: 2, totalSteps: 5 }),
        completedSteps: Math.max(patient.careContinuityScore?.completedSteps || 2, 3),
        lastMilestone: `Referral Initiated to ${referral.toFacilityName || 'District Facility'}`
      }
    });

    // Timeline event
    const evtId = `evt-${Date.now()}`;
    await setDocument('healthRecords', evtId, {
      id: evtId,
      patientId: referral.patientId,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      facilityId: referral.fromFacilityId || req.user?.facilityId || 'fac-phc-shirur',
      facilityName: referral.fromFacilityName || 'Shirur PHC',
      providerName: req.user?.name || referral.referringDoctorName || 'Medical Officer',
      providerRole: 'Medical Officer',
      eventType: 'referral_created',
      title: `Inter-Facility Referral Created (${referral.toFacilityName})`,
      notes: `Reason: ${referral.reason || 'Specialist Evaluation'}. Specialist: ${referral.specialistRequired || 'General Physician'}. Provisional: ${referral.provisionalDiagnosis || 'Clinical Review'}.`,
      badgeType: 'urgent'
    });

    // Notify receiving facility
    const notifId = `notif-${Date.now()}`;
    await setDocument('notifications', notifId, {
      id: notifId,
      recipientRole: 'facility',
      title: 'New Incoming Referral',
      message: `Referral received for ${referral.patientName} from ${referral.fromFacilityName || 'PHC'}.`,
      type: 'referral',
      read: false,
      timestamp: 'Just now'
    });

    res.status(201).json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to create referral' }
    });
  }
});

// PATCH /api/referrals/:id
referralsRouter.patch('/:id', requireRole('doctor', 'facility'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, appointmentDate, appointmentTime } = req.body;
    const validStatuses = ['sent', 'accepted', 'scheduled', 'completed', 'cancelled', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: `Invalid referral status. Valid: ${validStatuses.join(', ')}` }
      });
    }

    const ref = await getDocById('referrals', req.params.id);
    if (!ref) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Referral not found' }
      });
    }

    const updates: any = {
      status: status || ref.status,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.name || 'Facility Staff',
      ...(appointmentDate ? { appointmentDate } : {}),
      ...(appointmentTime ? { appointmentTime } : {})
    };

    const updated = await updateDocument('referrals', req.params.id, updates);

    // Timeline event
    let timelineTitle = `Referral Status: ${(status || ref.status).replace('_', ' ').toUpperCase()}`;
    let badgeType = 'default';
    if (status === 'accepted') {
      timelineTitle = `Referral Accepted by ${ref.toFacilityName}`;
      badgeType = 'success';
    } else if (status === 'scheduled') {
      timelineTitle = `Specialist Appointment Scheduled (${appointmentDate || 'Upcoming'})`;
      badgeType = 'success';
    } else if (status === 'completed') {
      timelineTitle = `Specialist Consultation Completed at ${ref.toFacilityName}`;
      badgeType = 'success';
    }

    const evtId = `evt-${Date.now()}`;
    await setDocument('healthRecords', evtId, {
      id: evtId,
      patientId: ref.patientId,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      facilityId: ref.toFacilityId,
      facilityName: ref.toFacilityName,
      providerName: req.user?.name || 'Facility Desk',
      providerRole: 'Facility Staff',
      eventType: status === 'accepted' ? 'referral_accepted' : 'appointment',
      title: timelineTitle,
      notes: `Referral ${ref.id} updated to ${status}. Date: ${appointmentDate || 'Registered'}.`,
      badgeType
    });

    // If scheduled or completed, create automated ASHA follow-up task
    if (status === 'scheduled' || status === 'completed') {
      const followUpId = `fup-${Date.now()}`;
      await setDocument('followUps', followUpId, {
        id: followUpId,
        patientId: ref.patientId,
        patientName: ref.patientName,
        patientVillage: ref.patientVillage || 'Shirur Rural',
        phone: '+91 98234 11209',
        category: 'high_risk',
        assignedAshaName: 'Sunita Tai Gavade',
        dueDate: appointmentDate || 'Tomorrow',
        status: 'due',
        reason: `Post-referral follow-up: verify patient reached ${ref.toFacilityName} and received discharge prescriptions.`
      });
    }

    // Notify frontline worker
    const notifId = `notif-${Date.now()}`;
    await setDocument('notifications', notifId, {
      id: notifId,
      recipientRole: 'asha',
      title: 'Referral Status Updated',
      message: `Referral for ${ref.patientName} was marked as ${status} by ${ref.toFacilityName}.`,
      type: 'referral',
      read: false,
      timestamp: 'Just now'
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to update referral' }
    });
  }
});

