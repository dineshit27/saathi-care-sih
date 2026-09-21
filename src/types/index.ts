export type UserRole = 'patient' | 'asha' | 'doctor' | 'facility' | 'admin';

export type LanguageCode = 'en' | 'mr' | 'hi';

export type RiskLevel = 'routine' | 'urgent' | 'emergency' | 'follow-up';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  facilityId?: string;
  facilityName?: string;
  village?: string;
  preferredLanguage: LanguageCode;
  phone?: string;
}

export interface Facility {
  id: string;
  name: string;
  type: 'PHC' | 'CHC' | 'Sub-District Hospital' | 'District Hospital' | 'Diagnostic Centre';
  district: string;
  taluka: string;
  contactNumber: string;
  activeDoctors: number;
  doctorsOnDuty?: number;
  ambulanceAvailable: boolean;
  totalQueueToday: number;
  currentQueueCount?: number;
  totalReferralsReceived?: number;
  totalReferralsSent?: number;
  capacityLevel: 'Normal' | 'High' | 'Critical';
}

export interface Patient {
  id: string;
  abhaId: string;
  name: string;
  age: number;
  gender: 'Female' | 'Male' | 'Other';
  phone: string;
  village: string;
  taluka: string;
  preferredLanguage: LanguageCode;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  existingConditions: string[];
  currentSymptoms: string[];
  vitals?: Vitals;
  riskLevel: RiskLevel;
  consent: {
    status: boolean;
    timestamp: string;
    version: string;
  };
  registeredAt: string;
  registeredByRole: string;
  assignedAsha: string;
  careContinuityScore: {
    completedSteps: number;
    totalSteps: number;
    lastMilestone: string;
  };
}

export interface Vitals {
  temperature?: number; // Fahrenheit
  pulse?: number; // bpm
  systolicBp?: number;
  diastolicBp?: number;
  spo2?: number; // percentage
  respiratoryRate?: number; // per min
  weight?: number; // kg
  recordedAt?: string;
}

export interface HealthTimelineEvent {
  id: string;
  patientId: string;
  timestamp: string;
  facilityId: string;
  facilityName: string;
  providerName: string;
  providerRole: string;
  eventType:
    | 'registration'
    | 'triage'
    | 'consultation'
    | 'diagnostic_request'
    | 'diagnostic_result'
    | 'referral_created'
    | 'referral_accepted'
    | 'appointment'
    | 'medicine_dispensed'
    | 'follow_up_completed'
    | 'emergency_escalation';
  title: string;
  notes: string;
  vitals?: Vitals;
  badgeType?: 'default' | 'urgent' | 'emergency' | 'success';
}

export interface QueueEntry {
  id: string;
  tokenNumber: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientVillage: string;
  facilityId: string;
  facilityName: string;
  doctorId: string;
  doctorName: string;
  status: 'waiting' | 'in_consultation' | 'completed' | 'deferred' | 'no_show';
  priority: RiskLevel;
  joinedAt: string;
  estimatedWaitMinutes: number;
}

export interface Referral {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientVillage: string;
  fromFacilityId: string;
  fromFacilityName: string;
  toFacilityId: string;
  toFacilityName: string;
  referringDoctorName: string;
  receivingDoctorName?: string;
  reason: string;
  priority: RiskLevel;
  provisionalDiagnosis: string;
  clinicalNotes: string;
  status: 'created' | 'sent' | 'accepted' | 'scheduled' | 'confirmed' | 'completed' | 'follow_up_pending';
  appointmentDate?: string;
  appointmentTime?: string;
  transportAssisted: boolean;
  specialistRequired: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiagnosticOrder {
  id: string;
  patientId: string;
  patientName: string;
  testType: string;
  facilityId: string;
  facilityName: string;
  requestingDoctor: string;
  status: 'requested' | 'scheduled' | 'sample_collected' | 'processing' | 'result_available' | 'doctor_reviewed';
  requestedAt: string;
  sampleCollectedAt?: string;
  completedAt?: string;
  resultSummary?: string;
  findings?: string;
  isAbnormal?: boolean;
}

export interface MedicineStock {
  id: string;
  medicineName: string;
  genericName: string;
  dosage: string;
  dosageForm?: string;
  strength?: string;
  category: 'Essential' | 'Maternal' | 'Antibiotic' | 'Cardiovascular' | 'Pediatric' | string;
  facilityId: string;
  facilityName: string;
  availableQuantity: number;
  unit: string;
  status: 'available' | 'low_stock' | 'out_of_stock';
  alternativeSuggestions?: string[];
  batchNumber?: string;
  lastUpdated: string;
}

export interface FollowUpTask {
  id: string;
  patientId: string;
  patientName: string;
  patientVillage: string;
  phone: string;
  category: 'maternal' | 'child' | 'chronic' | 'elderly' | 'high_risk' | 'post_referral' | 'missed_appointment' | string;
  assignedAshaName: string;
  dueDate: string;
  status: 'due' | 'contacted' | 'visit_scheduled' | 'completed' | 'escalated' | 'overdue';
  reason: string;
  lastVisitNotes?: string;
  completedAt?: string;
}

export interface AppNotification {
  id: string;
  recipientRole: UserRole | 'all';
  recipientId?: string;
  title: string;
  message: string;
  type: 'appointment' | 'referral' | 'diagnostic' | 'medicine' | 'follow_up' | 'emergency' | 'system';
  read: boolean;
  timestamp: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  facilityName: string;
  details: string;
}

export interface OfflineAction {
  id: string;
  actionType: 'register_patient' | 'record_vitals' | 'create_followup' | 'create_referral';
  payload: any;
  timestamp: string;
  synced: boolean;
}
