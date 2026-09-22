import {
  Facility,
  Patient,
  QueueEntry,
  Referral,
  DiagnosticOrder,
  MedicineStock,
  FollowUpTask,
  AuditLogEntry,
  HealthTimelineEvent,
  AppNotification
} from '../types';

export const initialFacilities: Facility[] = [
  {
    id: 'fac-phc-shirur',
    name: 'Shirur Primary Health Centre (PHC)',
    type: 'PHC',
    district: 'Pune',
    taluka: 'Shirur',
    contactNumber: '+91 2138 222104',
    activeDoctors: 2,
    ambulanceAvailable: true,
    totalQueueToday: 14,
    capacityLevel: 'Normal'
  },
  {
    id: 'fac-chc-manchar',
    name: 'Manchar Community Health Centre (CHC)',
    type: 'CHC',
    district: 'Pune',
    taluka: 'Ambegaon',
    contactNumber: '+91 2133 223405',
    activeDoctors: 4,
    ambulanceAvailable: true,
    totalQueueToday: 28,
    capacityLevel: 'Normal'
  },
  {
    id: 'fac-sdh-baramati',
    name: 'Baramati Sub-District Hospital',
    type: 'Sub-District Hospital',
    district: 'Pune',
    taluka: 'Baramati',
    contactNumber: '+91 2112 244102',
    activeDoctors: 8,
    ambulanceAvailable: true,
    totalQueueToday: 62,
    capacityLevel: 'High'
  },
  {
    id: 'fac-dh-pune',
    name: 'Aundh District Hospital',
    type: 'District Hospital',
    district: 'Pune',
    taluka: 'Haveli',
    contactNumber: '+91 20 2728 1008',
    activeDoctors: 18,
    ambulanceAvailable: true,
    totalQueueToday: 140,
    capacityLevel: 'High'
  },
  {
    id: 'fac-diag-pune',
    name: 'District Public Health Diagnostic Hub',
    type: 'Diagnostic Centre',
    district: 'Pune',
    taluka: 'Pune City',
    contactNumber: '+91 20 2612 4589',
    activeDoctors: 3,
    ambulanceAvailable: false,
    totalQueueToday: 35,
    capacityLevel: 'Normal'
  }
];

export const initialPatients: Patient[] = [
  {
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
    existingConditions: ['Second Trimester Antenatal Care', 'Mild Gestational Anemia'],
    currentSymptoms: ['Morning dizziness', 'Occasional visual blurriness', 'Mild pedal edema'],
    vitals: {
      temperature: 98.6,
      pulse: 88,
      systolicBp: 142,
      diastolicBp: 92,
      spo2: 98,
      respiratoryRate: 18,
      weight: 58,
      recordedAt: '2026-09-21 08:00 AM'
    },
    riskLevel: 'urgent',
    consent: {
      status: true,
      timestamp: '2026-09-21T07:45:00Z',
      version: 'MH-PHC-CONSENT-2026.1'
    },
    registeredAt: '2026-09-21T07:45:00Z',
    registeredByRole: 'asha',
    assignedAsha: 'Sunita Tai Gavade',
    careContinuityScore: {
      completedSteps: 2,
      totalSteps: 5,
      lastMilestone: 'Assisted Digital Triage Completed'
    }
  },
  {
    id: 'pat-001',
    abhaId: '91-4432-8871-0023',
    name: 'Ramesh Patil',
    age: 48,
    gender: 'Male',
    phone: '+91 98234 11209',
    village: 'Shirur Rural',
    taluka: 'Shirur',
    preferredLanguage: 'mr',
    emergencyContact: {
      name: 'Sharda Patil',
      relationship: 'Spouse',
      phone: '+91 98234 11210'
    },
    existingConditions: ['Essential Hypertension (3 yrs)', 'Type 2 Diabetes Mellitus'],
    currentSymptoms: ['Recurrent morning dizziness', 'Blurry vision episodes', 'Tension headache'],
    vitals: {
      temperature: 98.4,
      pulse: 88,
      systolicBp: 154,
      diastolicBp: 96,
      spo2: 97,
      respiratoryRate: 18,
      weight: 68,
      recordedAt: '2026-09-21 08:30 AM'
    },
    riskLevel: 'urgent',
    consent: {
      status: true,
      timestamp: '2026-09-21T08:15:00Z',
      version: 'MH-PHC-CONSENT-2026.1'
    },
    registeredAt: '2026-09-21T08:15:00Z',
    registeredByRole: 'asha',
    assignedAsha: 'Sunita Tai Gavade',
    careContinuityScore: {
      completedSteps: 3,
      totalSteps: 5,
      lastMilestone: 'Diagnostic Ordered & Referral Initiated'
    }
  },
  {
    id: 'pat-002',
    abhaId: '91-8721-6543-9901',
    name: 'Sunita Bai Shinde',
    age: 26,
    gender: 'Female',
    phone: '+91 97654 33211',
    village: 'Pabal',
    taluka: 'Shirur',
    preferredLanguage: 'mr',
    emergencyContact: {
      name: 'Kisan Shinde',
      relationship: 'Husband',
      phone: '+91 97654 33212'
    },
    existingConditions: ['Primi-gravida (32 Weeks Gestation)', 'Gestational Hypertension'],
    currentSymptoms: ['Bilateral pedal edema', 'Occasional epigastric discomfort'],
    vitals: {
      temperature: 98.6,
      pulse: 92,
      systolicBp: 142,
      diastolicBp: 92,
      spo2: 98,
      respiratoryRate: 20,
      weight: 56,
      recordedAt: '2026-09-20 10:15 AM'
    },
    riskLevel: 'urgent',
    consent: {
      status: true,
      timestamp: '2026-09-18T09:00:00Z',
      version: 'MH-PHC-CONSENT-2026.1'
    },
    registeredAt: '2026-09-18T09:00:00Z',
    registeredByRole: 'asha',
    assignedAsha: 'Sunita Tai Gavade',
    careContinuityScore: {
      completedSteps: 4,
      totalSteps: 5,
      lastMilestone: 'Specialist Sonography Completed'
    }
  },
  {
    id: 'pat-003',
    abhaId: '91-3312-9904-4412',
    name: 'Master Aarav Kamble',
    age: 4,
    gender: 'Male',
    phone: '+91 99221 44556',
    village: 'Nimgaon Bhogi',
    taluka: 'Shirur',
    preferredLanguage: 'mr',
    emergencyContact: {
      name: 'Priyanka Kamble',
      relationship: 'Mother',
      phone: '+91 99221 44556'
    },
    existingConditions: ['Recurrent wheezing', 'Mild malnutrition (Grade 1)'],
    currentSymptoms: ['Barking cough for 4 days', 'Fever spiking at night', 'Reduced appetite'],
    vitals: {
      temperature: 101.8,
      pulse: 118,
      systolicBp: 96,
      diastolicBp: 62,
      spo2: 94,
      respiratoryRate: 34,
      weight: 14,
      recordedAt: '2026-09-21 09:00 AM'
    },
    riskLevel: 'urgent',
    consent: {
      status: true,
      timestamp: '2026-09-21T08:55:00Z',
      version: 'MH-PHC-CONSENT-2026.1'
    },
    registeredAt: '2026-09-21T08:55:00Z',
    registeredByRole: 'asha',
    assignedAsha: 'Sunita Tai Gavade',
    careContinuityScore: {
      completedSteps: 2,
      totalSteps: 5,
      lastMilestone: 'Triage Completed & Waiting in Queue'
    }
  },
  {
    id: 'pat-004',
    abhaId: '91-6671-2244-1189',
    name: 'Laxmibai Deshmukh',
    age: 68,
    gender: 'Female',
    phone: '+91 94230 77881',
    village: 'Koregaon Bhima',
    taluka: 'Shirur',
    preferredLanguage: 'mr',
    emergencyContact: {
      name: 'Balasaheb Deshmukh',
      relationship: 'Son',
      phone: '+91 94230 77882'
    },
    existingConditions: ['Osteoarthritis bilateral knees', 'Mature senile cataract left eye'],
    currentSymptoms: ['Difficulty walking 50 meters', 'Diminished vision left eye'],
    vitals: {
      temperature: 98.2,
      pulse: 74,
      systolicBp: 134,
      diastolicBp: 84,
      spo2: 96,
      respiratoryRate: 16,
      weight: 52,
      recordedAt: '2026-09-19 11:00 AM'
    },
    riskLevel: 'routine',
    consent: {
      status: true,
      timestamp: '2026-09-19T10:45:00Z',
      version: 'MH-PHC-CONSENT-2026.1'
    },
    registeredAt: '2026-09-19T10:45:00Z',
    registeredByRole: 'asha',
    assignedAsha: 'Sunita Tai Gavade',
    careContinuityScore: {
      completedSteps: 5,
      totalSteps: 5,
      lastMilestone: 'Follow-up Mobility Checkup Closed'
    }
  }
];

export const initialQueue: QueueEntry[] = [
  {
    id: 'q-001',
    tokenNumber: 'A001',
    patientId: 'pat-004',
    patientName: 'Laxmibai Deshmukh',
    patientAge: 68,
    patientGender: 'Female',
    patientVillage: 'Koregaon Bhima',
    facilityId: 'fac-phc-shirur',
    facilityName: 'Shirur Primary Health Centre (PHC)',
    doctorId: 'doc-001',
    doctorName: 'Dr. Anand Kulkarni',
    status: 'completed',
    priority: 'routine',
    joinedAt: '2026-09-21 08:30 AM',
    estimatedWaitMinutes: 0
  },
  {
    id: 'q-002',
    tokenNumber: 'A002',
    patientId: 'pat-003',
    patientName: 'Master Aarav Kamble',
    patientAge: 4,
    patientGender: 'Male',
    patientVillage: 'Nimgaon Bhogi',
    facilityId: 'fac-phc-shirur',
    facilityName: 'Shirur Primary Health Centre (PHC)',
    doctorId: 'doc-001',
    doctorName: 'Dr. Anand Kulkarni',
    status: 'in_consultation',
    priority: 'urgent',
    joinedAt: '2026-09-21 08:55 AM',
    estimatedWaitMinutes: 0
  },
  {
    id: 'q-003',
    tokenNumber: 'A003',
    patientId: 'pat-001',
    patientName: 'Ramesh Patil',
    patientAge: 48,
    patientGender: 'Male',
    patientVillage: 'Shirur Rural',
    facilityId: 'fac-phc-shirur',
    facilityName: 'Shirur Primary Health Centre (PHC)',
    doctorId: 'doc-001',
    doctorName: 'Dr. Anand Kulkarni',
    status: 'waiting',
    priority: 'urgent',
    joinedAt: '2026-09-21 09:10 AM',
    estimatedWaitMinutes: 12
  },
  {
    id: 'q-004',
    tokenNumber: 'A004',
    patientId: 'pat-002',
    patientName: 'Sunita Bai Shinde',
    patientAge: 26,
    patientGender: 'Female',
    patientVillage: 'Pabal',
    facilityId: 'fac-phc-shirur',
    facilityName: 'Shirur Primary Health Centre (PHC)',
    doctorId: 'doc-001',
    doctorName: 'Dr. Anand Kulkarni',
    status: 'waiting',
    priority: 'urgent',
    joinedAt: '2026-09-21 09:25 AM',
    estimatedWaitMinutes: 24
  }
];

export const initialReferrals: Referral[] = [
  {
    id: 'REF-2026-MH-0841',
    patientId: 'pat-001',
    patientName: 'Ramesh Patil',
    patientAge: 48,
    patientGender: 'Male',
    patientVillage: 'Shirur Rural',
    fromFacilityId: 'fac-phc-shirur',
    fromFacilityName: 'Shirur PHC',
    toFacilityId: 'fac-dh-pune',
    toFacilityName: 'Aundh District Hospital',
    referringDoctorName: 'Dr. Anand Kulkarni (PHC Medical Officer)',
    receivingDoctorName: 'Dr. S. K. Joshi (Senior Consultant Physician)',
    reason: 'Uncontrolled Hypertension with suspect Fundus retinal changes & microalbuminuria evaluation',
    priority: 'urgent',
    provisionalDiagnosis: 'Hypertensive Retinopathy & Stage 2 Hypertension',
    clinicalNotes: 'Blood pressure remains 154/96 despite Amlodipine 5mg. Complains of visual blurriness. Needs ophthalmology and nephrology consult.',
    status: 'scheduled',
    appointmentDate: '2026-09-24',
    appointmentTime: '11:30 AM',
    transportAssisted: true,
    specialistRequired: 'Internal Medicine / Ophthalmology',
    createdAt: '2026-09-21T09:30:00Z',
    updatedAt: '2026-09-21T10:05:00Z'
  },
  {
    id: 'REF-2026-MH-0792',
    patientId: 'pat-002',
    patientName: 'Sunita Bai Shinde',
    patientAge: 26,
    patientGender: 'Female',
    patientVillage: 'Pabal',
    fromFacilityId: 'fac-phc-shirur',
    fromFacilityName: 'Shirur PHC',
    toFacilityId: 'fac-sdh-baramati',
    toFacilityName: 'Baramati Sub-District Hospital',
    referringDoctorName: 'Dr. Anand Kulkarni (PHC Medical Officer)',
    receivingDoctorName: 'Dr. Meera Gokhale (Consultant Obstetrician)',
    reason: 'Gestational Hypertension at 32 weeks with fetal growth monitoring Doppler',
    priority: 'urgent',
    provisionalDiagnosis: 'High-Risk Pregnancy: Mild Pre-eclampsia evaluation',
    clinicalNotes: 'Urine albumin trace positive, BP 142/92. Immediate OBG review with Doppler ultrasound scheduled.',
    status: 'accepted',
    appointmentDate: '2026-09-23',
    appointmentTime: '10:00 AM',
    transportAssisted: true,
    specialistRequired: 'Obstetrics & Gynecology',
    createdAt: '2026-09-20T11:00:00Z',
    updatedAt: '2026-09-20T14:30:00Z'
  }
];

export const initialDiagnostics: DiagnosticOrder[] = [
  {
    id: 'diag-001',
    patientId: 'pat-001',
    patientName: 'Ramesh Patil',
    testType: 'HbA1c & Fasting Lipid Profile',
    facilityId: 'fac-phc-shirur',
    facilityName: 'Shirur Primary Health Centre (PHC)',
    requestingDoctor: 'Dr. Anand Kulkarni',
    status: 'sample_collected',
    requestedAt: '2026-09-21 09:20 AM',
    sampleCollectedAt: '2026-09-21 09:40 AM',
    resultSummary: 'Sample in cold chain transit to District Lab',
    findings: 'Pending analysis',
    isAbnormal: false
  },
  {
    id: 'diag-002',
    patientId: 'pat-001',
    patientName: 'Ramesh Patil',
    testType: 'ECG 12-Lead Standard',
    facilityId: 'fac-phc-shirur',
    facilityName: 'Shirur Primary Health Centre (PHC)',
    requestingDoctor: 'Dr. Anand Kulkarni',
    status: 'result_available',
    requestedAt: '2026-09-21 09:15 AM',
    sampleCollectedAt: '2026-09-21 09:22 AM',
    completedAt: '2026-09-21 09:30 AM',
    resultSummary: 'Sinus rhythm, HR 86/min. Early Left Ventricular Strain pattern in V5-V6.',
    findings: 'No acute ST elevation. LV strain voltage criteria met.',
    isAbnormal: true
  },
  {
    id: 'diag-003',
    patientId: 'pat-002',
    patientName: 'Sunita Bai Shinde',
    testType: 'Obstetric Ultrasound with Fetal Doppler',
    facilityId: 'fac-sdh-baramati',
    facilityName: 'Baramati Sub-District Hospital',
    requestingDoctor: 'Dr. Anand Kulkarni',
    status: 'scheduled',
    requestedAt: '2026-09-20 11:30 AM',
    resultSummary: 'Scheduled with Radiologist on 23 Sept 10:30 AM',
    isAbnormal: false
  }
];

export const initialMedicines: MedicineStock[] = [
  {
    id: 'med-001',
    medicineName: 'Amlodipine 5mg Tablets',
    genericName: 'Amlodipine Besylate',
    dosage: '5 mg',
    category: 'Cardiovascular',
    facilityId: 'fac-phc-shirur',
    facilityName: 'Shirur PHC',
    availableQuantity: 420,
    unit: 'strips (10 tabs)',
    status: 'available',
    lastUpdated: '2026-09-21 08:00 AM'
  },
  {
    id: 'med-002',
    medicineName: 'Metformin 500mg ER',
    genericName: 'Metformin Hydrochloride',
    dosage: '500 mg',
    category: 'Essential',
    facilityId: 'fac-phc-shirur',
    facilityName: 'Shirur PHC',
    availableQuantity: 280,
    unit: 'strips (10 tabs)',
    status: 'available',
    lastUpdated: '2026-09-21 08:00 AM'
  },
  {
    id: 'med-003',
    medicineName: 'Telmisartan 40mg Tablets',
    genericName: 'Telmisartan',
    dosage: '40 mg',
    category: 'Cardiovascular',
    facilityId: 'fac-phc-shirur',
    facilityName: 'Shirur PHC',
    availableQuantity: 18,
    unit: 'strips (10 tabs)',
    status: 'low_stock',
    lastUpdated: '2026-09-21 08:00 AM'
  },
  {
    id: 'med-004',
    medicineName: 'Iron & Folic Acid (IFA) Red',
    genericName: 'Ferrous Sulfate + Folic Acid',
    dosage: '100mg elemental iron',
    category: 'Maternal',
    facilityId: 'fac-phc-shirur',
    facilityName: 'Shirur PHC',
    availableQuantity: 950,
    unit: 'strips (10 tabs)',
    status: 'available',
    lastUpdated: '2026-09-20 04:00 PM'
  },
  {
    id: 'med-005',
    medicineName: 'Oral Rehydration Salts (ORS) WHO Formula',
    genericName: 'Electrolyte blend 20.5g',
    dosage: '1 Litre sachet',
    category: 'Pediatric',
    facilityId: 'fac-phc-shirur',
    facilityName: 'Shirur PHC',
    availableQuantity: 640,
    unit: 'sachets',
    status: 'available',
    lastUpdated: '2026-09-21 08:00 AM'
  },
  {
    id: 'med-006',
    medicineName: 'Salbutamol Inhaler (100mcg)',
    genericName: 'Salbutamol Sulfate CFC-Free',
    dosage: '200 doses',
    category: 'Essential',
    facilityId: 'fac-phc-shirur',
    facilityName: 'Shirur PHC',
    availableQuantity: 0,
    unit: 'canisters',
    status: 'out_of_stock',
    lastUpdated: '2026-09-21 07:30 AM'
  },
  {
    id: 'med-007',
    medicineName: 'Salbutamol Inhaler (100mcg)',
    genericName: 'Salbutamol Sulfate CFC-Free',
    dosage: '200 doses',
    category: 'Essential',
    facilityId: 'fac-chc-manchar',
    facilityName: 'Manchar CHC (14 km away)',
    availableQuantity: 34,
    unit: 'canisters',
    status: 'available',
    lastUpdated: '2026-09-21 08:15 AM'
  }
];

export const initialFollowUps: FollowUpTask[] = [
  {
    id: 'fup-001',
    patientId: 'pat-001',
    patientName: 'Ramesh Patil',
    patientVillage: 'Shirur Rural',
    phone: '+91 98234 11209',
    category: 'chronic',
    assignedAshaName: 'Sunita Tai Gavade',
    dueDate: '2026-09-25',
    status: 'due',
    reason: 'Post-District Hospital specialist appointment checkup & medicine compliance check'
  },
  {
    id: 'fup-002',
    patientId: 'pat-002',
    patientName: 'Sunita Bai Shinde',
    patientVillage: 'Pabal',
    phone: '+91 97654 33211',
    category: 'maternal',
    assignedAshaName: 'Sunita Tai Gavade',
    dueDate: '2026-09-22',
    status: 'due',
    reason: 'ANC Vitals check (BP + urine protein strip check at home prior to SDH visit)'
  },
  {
    id: 'fup-003',
    patientId: 'pat-004',
    patientName: 'Laxmibai Deshmukh',
    patientVillage: 'Koregaon Bhima',
    phone: '+91 94230 77881',
    category: 'elderly',
    assignedAshaName: 'Sunita Tai Gavade',
    dueDate: '2026-09-20',
    status: 'completed',
    reason: 'Joint pain relief medication assessment and mobility check',
    lastVisitNotes: 'Patient taking Paracetamol as advised. Knee stiffness slightly lessened; walking stick provided.',
    completedAt: '2026-09-20 03:30 PM'
  }
];

export const initialTimelineEvents: HealthTimelineEvent[] = [
  {
    id: 'evt-001',
    patientId: 'pat-001',
    timestamp: '2026-09-21 08:15 AM',
    facilityId: 'fac-phc-shirur',
    facilityName: 'Shirur PHC',
    providerName: 'Sunita Tai Gavade',
    providerRole: 'ASHA Worker',
    eventType: 'registration',
    title: 'Patient Registered with Digital Consent',
    notes: 'Citizen consented to longitudinal continuity record under public health framework.',
    badgeType: 'default'
  },
  {
    id: 'evt-002',
    patientId: 'pat-001',
    timestamp: '2026-09-21 08:30 AM',
    facilityId: 'fac-phc-shirur',
    facilityName: 'Shirur PHC',
    providerName: 'Sunita Tai Gavade',
    providerRole: 'ASHA Worker',
    eventType: 'triage',
    title: 'Digital Triage & Vitals Recorded',
    notes: 'BP: 154/96 mmHg, Pulse: 88, SpO2: 97%. Recurrent morning dizziness and visual blurriness flagged.',
    vitals: {
      temperature: 98.4,
      pulse: 88,
      systolicBp: 154,
      diastolicBp: 96,
      spo2: 97,
      respiratoryRate: 18,
      weight: 68
    },
    badgeType: 'urgent'
  },
  {
    id: 'evt-003',
    patientId: 'pat-001',
    timestamp: '2026-09-21 09:15 AM',
    facilityId: 'fac-phc-shirur',
    facilityName: 'Shirur PHC',
    providerName: 'Dr. Anand Kulkarni',
    providerRole: 'Medical Officer',
    eventType: 'consultation',
    title: 'Medical Officer Clinical Evaluation',
    notes: 'Stage 2 Hypertension with suspected hypertensive organ involvement. 12-lead ECG and lab blood work ordered.',
    badgeType: 'default'
  },
  {
    id: 'evt-004',
    patientId: 'pat-001',
    timestamp: '2026-09-21 09:30 AM',
    facilityId: 'fac-phc-shirur',
    facilityName: 'Shirur PHC',
    providerName: 'Dr. Anand Kulkarni',
    providerRole: 'Medical Officer',
    eventType: 'diagnostic_result',
    title: 'Point-of-Care ECG Completed',
    notes: 'ECG shows early Left Ventricular strain. Confirmed requirement for specialist cardiologist/physician review.',
    badgeType: 'urgent'
  },
  {
    id: 'evt-005',
    patientId: 'pat-001',
    timestamp: '2026-09-21 09:35 AM',
    facilityId: 'fac-phc-shirur',
    facilityName: 'Shirur PHC',
    providerName: 'Dr. Anand Kulkarni',
    providerRole: 'Medical Officer',
    eventType: 'referral_created',
    title: 'Inter-Facility Referral Dispatched',
    notes: 'Referred to Aundh District Hospital for specialist physician consultation and fundus imaging on 24 Sept 11:30 AM.',
    badgeType: 'default'
  },
  {
    id: 'evt-006',
    patientId: 'pat-001',
    timestamp: '2026-09-21 10:05 AM',
    facilityId: 'fac-dh-pune',
    facilityName: 'Aundh District Hospital',
    providerName: 'Dr. S. K. Joshi',
    providerRole: 'Specialist Physician',
    eventType: 'referral_accepted',
    title: 'Referral Accepted by District Hospital',
    notes: 'Specialist appointment slot confirmed for 24 September 2026 at 11:30 AM in Room 14.',
    badgeType: 'success'
  }
];

export const initialNotifications: AppNotification[] = [
  {
    id: 'notif-001',
    recipientRole: 'patient',
    recipientId: 'pat-001',
    title: 'Referral to District Hospital Accepted',
    message: 'Your appointment at Aundh District Hospital is confirmed for 24 September at 11:30 AM.',
    type: 'referral',
    read: false,
    timestamp: '10 mins ago'
  },
  {
    id: 'notif-002',
    recipientRole: 'patient',
    recipientId: 'pat-001',
    title: 'Diagnostic Test Status',
    message: 'Your ECG test has been reviewed by Dr. Anand Kulkarni. Blood sample is in transit.',
    type: 'diagnostic',
    read: false,
    timestamp: '25 mins ago'
  },
  {
    id: 'notif-003',
    recipientRole: 'asha',
    title: 'High-Risk Referral Scheduled',
    message: 'Patient Ramesh Patil (Shirur Rural) referral to District Hospital accepted. Follow-up task created.',
    type: 'referral',
    read: false,
    timestamp: '5 mins ago'
  },
  {
    id: 'notif-004',
    recipientRole: 'doctor',
    title: 'Urgent Triage Alert',
    message: 'Master Aarav Kamble (Age 4) SpO2 94% with respiratory distress currently waiting in queue.',
    type: 'emergency',
    read: false,
    timestamp: '2 mins ago'
  }
];

export const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'log-001',
    timestamp: '2026-09-21 08:15:10 AM',
    userName: 'Sunita Tai Gavade',
    userRole: 'asha',
    action: 'Patient Registered & Consented',
    entityType: 'Patient',
    entityId: 'pat-001',
    facilityName: 'Shirur PHC',
    details: 'New record created with ABHA 91-4432-8871-0023 with digital consent confirmation.'
  },
  {
    id: 'log-002',
    timestamp: '2026-09-21 08:31:40 AM',
    userName: 'Sunita Tai Gavade',
    userRole: 'asha',
    action: 'Triage Vitals Captured',
    entityType: 'Vitals',
    entityId: 'pat-001',
    facilityName: 'Shirur PHC',
    details: 'Recorded BP 154/96, Pulse 88, SpO2 97%. Triggered AI triage check.'
  },
  {
    id: 'log-003',
    timestamp: '2026-09-21 09:35:12 AM',
    userName: 'Dr. Anand Kulkarni',
    userRole: 'doctor',
    action: 'Referral Initiated',
    entityType: 'Referral',
    entityId: 'REF-2026-MH-0841',
    facilityName: 'Shirur PHC',
    details: 'Dispatched inter-facility referral to Aundh District Hospital.'
  },
  {
    id: 'log-004',
    timestamp: '2026-09-21 10:05:04 AM',
    userName: 'Staff Desk Baramati / Aundh',
    userRole: 'facility',
    action: 'Referral Accepted & Slot Confirmed',
    entityType: 'Referral',
    entityId: 'REF-2026-MH-0841',
    facilityName: 'Aundh District Hospital',
    details: 'Slot 11:30 AM 24 Sept allocated by receiving facility.'
  }
];
