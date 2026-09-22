import { Router, Response } from 'express';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';
import { getCollectionDocs, getDocById, setDocument, updateDocument } from '../dbHelper';

export const followupsRouter = Router();

// GET /api/followups
followupsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const followups = await getCollectionDocs('followUps');
    res.json({ success: true, count: followups.length, data: followups });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FOLLOWUPS_FETCH_FAILED', message: error.message || 'Failed to retrieve follow-up tasks' }
    });
  }
});

// POST /api/followups - Restricted to ASHA, Doctors, and Admins
followupsRouter.post(
  '/',
  requireRole('asha', 'doctor', 'admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = req.body;
      if (!data || !data.patientId || !data.dueDate) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Follow-up creation requires patientId and dueDate.'
          }
        });
      }

      const newId = `fup-${Date.now()}`;
      const followUp = {
        ...data,
        id: newId,
        status: data.status || 'due',
        createdAt: new Date().toISOString(),
        createdBy: req.user?.name || 'Staff'
      };

      const saved = await setDocument('followUps', newId, followUp);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FOLLOWUP_CREATION_FAILED', message: error.message || 'Failed to create follow-up task' }
      });
    }
  }
);

// PATCH /api/followups/:id - Restricted to ASHA, Doctors, and Admins
followupsRouter.patch(
  '/:id',
  requireRole('asha', 'doctor', 'admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, lastVisitNotes } = req.body;
      const fup = await getDocById('followUps', req.params.id);
      if (!fup) {
        return res.status(404).json({
          success: false,
          error: { code: 'TASK_NOT_FOUND', message: 'Follow-up task not found' }
        });
      }

      const updated = await updateDocument('followUps', req.params.id, {
        status,
        lastVisitNotes,
        completedAt: status === 'completed' ? new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : undefined,
        updatedBy: req.user?.name || 'ASHA Worker'
      });

      if (status === 'completed') {
        // Add Timeline Event
        const evtId = `evt-${Date.now()}`;
        await setDocument('healthRecords', evtId, {
          id: evtId,
          patientId: fup.patientId,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          facilityId: req.user?.facilityId || 'fac-phc-shirur',
          facilityName: req.user?.facilityName || 'Shirur PHC',
          providerName: req.user?.name || 'Sunita Tai Gavade',
          providerRole: req.user?.roleTitle || 'ASHA Frontline Worker',
          eventType: 'follow_up_completed',
          title: 'Community Follow-up Completed by ASHA',
          notes: `ASHA Note: ${lastVisitNotes || 'Follow-up home visit completed'}. Home check in Village ${fup.patientVillage || 'Rural Area'}.`,
          badgeType: 'success'
        });

        // Update patient care continuity score to 5/5!
        const patient = await getDocById('patients', fup.patientId);
        if (patient) {
          await updateDocument('patients', fup.patientId, {
            careContinuityScore: {
              completedSteps: 5,
              totalSteps: 5,
              lastMilestone: 'Full Continuum of Care Achieved (Post-Referral Follow-up Closed)'
            }
          });
        }

        // Notify doctor
        const notifId = `notif-${Date.now()}`;
        await setDocument('notifications', notifId, {
          id: notifId,
          recipientRole: 'doctor',
          title: 'Follow-up Confirmed',
          message: `ASHA completed follow-up visit for ${fup.patientName || 'Patient'} (${fup.patientVillage || 'Village'}).`,
          type: 'follow_up',
          read: false,
          timestamp: 'Just now'
        });
      }

      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: 'FOLLOWUP_UPDATE_FAILED', message: error.message || 'Failed to update follow-up task' }
      });
    }
  }
);

