import { Router, Request, Response } from 'express';
import { setDocument } from '../dbHelper';
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

// POST /api/seed
seedRouter.post('/', async (req: Request, res: Response) => {
  try {
    // Seed Facilities
    for (const fac of initialFacilities) {
      await setDocument('facilities', fac.id, fac);
    }

    // Seed Patients (including Meena Sharma and Ramesh Patil)
    for (const pat of initialPatients) {
      await setDocument('patients', pat.id, pat);
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
    }

    // Seed Queue Entries
    for (const q of initialQueue) {
      await setDocument('queueEntries', q.id, q);
    }

    // Seed Referrals
    for (const ref of initialReferrals) {
      await setDocument('referrals', ref.id, ref);
    }

    // Seed Diagnostics
    for (const diag of initialDiagnostics) {
      await setDocument('diagnostics', diag.id, diag);
    }

    // Seed Medicines
    for (const med of initialMedicines) {
      await setDocument('medicines', med.id, med);
    }

    // Seed Follow-ups
    for (const fup of initialFollowUps) {
      await setDocument('followUps', fup.id, fup);
    }

    // Seed Timeline Events
    for (const evt of initialTimelineEvents) {
      await setDocument('healthRecords', evt.id, evt);
    }

    // Seed Notifications
    for (const notif of initialNotifications) {
      await setDocument('notifications', notif.id, notif);
    }

    // Seed Audit Logs
    for (const log of initialAuditLogs) {
      await setDocument('auditLogs', log.id, log);
    }

    res.json({ success: true, message: 'Healthcare database successfully seeded with real persistent records.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
