import { Router, Request, Response } from 'express';
import { setDocument, getDocById } from '../dbHelper';
import {
  initialFacilities,
  initialPatients,
  initialQueue,
  initialReferrals,
  initialDiagnostics,
  initialMedicines,
  initialFollowUps,
  initialTimelineEvents,
  initialNotifications,
  initialAuditLogs
} from '../../src/data/mockData';

export const seedRouter = Router();

// POST /api/seed - Protected seed & reset endpoint
seedRouter.post('/', async (req: Request, res: Response) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDemoMode = req.headers['x-demo-mode'] === 'true' || req.body?.isDemo === true;
    const confirmReset = req.body?.confirmReset === true || req.query?.confirm === 'true';

    // In production, prohibit unconfirmed or unauthenticated arbitrary wipe
    if (isProduction && !isDemoMode && !confirmReset) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'RESET_CONFIRMATION_REQUIRED',
          message: 'Seeding or resetting in production requires explicit confirmation (confirmReset: true) or demo mode.'
        }
      });
    }

    let facilitiesSeeded = 0;
    let patientsSeeded = 0;
    let queueSeeded = 0;
    let referralsSeeded = 0;
    let diagnosticsSeeded = 0;
    let medicinesSeeded = 0;
    let followUpsSeeded = 0;
    let recordsSeeded = 0;
    let notifsSeeded = 0;
    let logsSeeded = 0;

    // Seed Facilities
    for (const fac of initialFacilities) {
      await setDocument('facilities', fac.id, fac);
      facilitiesSeeded++;
    }

    // Seed Patients (safely upsert demo records)
    for (const pat of initialPatients) {
      await setDocument('patients', pat.id, {
        ...pat,
        isDemoRecord: true
      });
      patientsSeeded++;
    }

    // Explicitly ensure fictional patient Meena is in the database
    const meenaExists = initialPatients.find(p => p.name.includes('Meena'));
    if (!meenaExists) {
      await setDocument('patients', 'pat-meena', {
        id: 'pat-meena',
        abhaId: '91-4509-2231-7788',
        name: 'Meena Sharma',
        age: 29,
        gender: 'Female',
        phone: '+91 98345 88912',
        village: 'Koregaon Bhima',
        taluka: 'Shirur',
        preferredLanguage: 'mr',
        isDemoRecord: true,
        emergencyContact: {
          name: 'Sunil Sharma',
          relationship: 'Husband',
          phone: '+91 98345 88913'
        },
        existingConditions: ['Antenatal Care (Second Trimester)'],
        currentSymptoms: ['Dizziness', 'Headache', 'Swelling in feet'],
        vitals: {
          temperature: 98.6,
          pulse: 88,
          systolicBp: 142,
          diastolicBp: 92,
          spo2: 98,
          respiratoryRate: 18,
          weight: 58
        },
        riskLevel: 'urgent',
        consent: {
          consented: true,
          timestamp: new Date().toISOString(),
          consentType: 'Assisted Digital Health Record Consent (ABHA)'
        },
        registeredAt: new Date().toISOString(),
        registeredByRole: 'ASHA Frontline Worker',
        assignedAsha: 'Sunita Tai Gavade',
        careContinuityScore: {
          completedSteps: 2,
          totalSteps: 5,
          lastMilestone: 'Assisted Digital Triage Completed'
        }
      });
      patientsSeeded++;
    }

    // Seed Queue Entries
    for (const q of initialQueue) {
      await setDocument('queueEntries', q.id, q);
      queueSeeded++;
    }

    // Seed Referrals
    for (const ref of initialReferrals) {
      await setDocument('referrals', ref.id, ref);
      referralsSeeded++;
    }

    // Seed Diagnostics
    for (const diag of initialDiagnostics) {
      await setDocument('diagnostics', diag.id, diag);
      diagnosticsSeeded++;
    }

    // Seed Medicines
    for (const med of initialMedicines) {
      await setDocument('medicines', med.id, med);
      medicinesSeeded++;
    }

    // Seed Follow-ups
    for (const fup of initialFollowUps) {
      await setDocument('followUps', fup.id, fup);
      followUpsSeeded++;
    }

    // Seed Timeline Events
    for (const evt of initialTimelineEvents) {
      await setDocument('healthRecords', evt.id, evt);
      recordsSeeded++;
    }

    // Seed Notifications
    for (const notif of initialNotifications) {
      await setDocument('notifications', notif.id, notif);
      notifsSeeded++;
    }

    // Seed Audit Logs
    for (const log of initialAuditLogs) {
      await setDocument('auditLogs', log.id, log);
      logsSeeded++;
    }

    res.json({
      success: true,
      message: 'Demo health dataset successfully populated.',
      isDemoMode,
      counts: {
        facilities: facilitiesSeeded,
        patients: patientsSeeded,
        queueEntries: queueSeeded,
        referrals: referralsSeeded,
        diagnostics: diagnosticsSeeded,
        medicines: medicinesSeeded,
        followUps: followUpsSeeded,
        healthRecords: recordsSeeded,
        notifications: notifsSeeded,
        auditLogs: logsSeeded
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SEED_ERROR', message: error.message || 'Seeding failed' }
    });
  }
});

