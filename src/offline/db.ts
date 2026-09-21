/**
 * Saathi Care - Offline IndexedDB Storage Engine (powered by `idb`)
 *
 * Implements a robust typed IndexedDB wrapper using the `idb` library for frontline health workers (ASHAs/ANMs).
 * Provides offline-first methods to store and retrieve:
 *  1. Patient registrations & offline drafts
 *  2. Triage records (vitals, symptoms, risk level)
 *  3. Referral drafts & specialist transfer passes
 *  4. Offline action queue for background cloud synchronization
 *
 * Includes automatic in-memory fallback for sandboxed iframes and private browsing modes.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  Patient,
  Vitals,
  RiskLevel,
  Referral,
  MedicineStock,
  FollowUpTask,
  OfflineAction
} from '../types';

export const DB_NAME = 'SaathiCare_Frontline_IDB';
export const DB_VERSION = 2;

// ============================================================================
// DATA MODELS
// ============================================================================

export interface OfflineTriageData {
  id: string;
  patientId: string;
  patientName: string;
  vitals: Vitals;
  riskLevel: RiskLevel;
  symptoms: string[];
  recordedAt: string;
  recordedByRole: string;
  recordedByName: string;
  synced: boolean;
}

// Alias for compatibility
export type OfflineVitalsEntry = OfflineTriageData;

export interface ReferralDraft {
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
  specialistRequired: string;
  priority: RiskLevel;
  provisionalDiagnosis: string;
  reason: string;
  clinicalNotes: string;
  transportAssisted: boolean;
  createdAt: string;
  updatedAt: string;
  isDraft: boolean;
  synced: boolean;
  referringDoctorName?: string;
  status?: string;
}

// ============================================================================
// IDB SCHEMA DEFINITION
// ============================================================================

export interface SaathiDBSchema extends DBSchema {
  patients: {
    key: string;
    value: Patient;
    indexes: {
      'by-village': string;
      'by-riskLevel': string;
      'by-registeredAt': string;
    };
  };
  triage_records: {
    key: string;
    value: OfflineTriageData;
    indexes: {
      'by-patientId': string;
      'by-recordedAt': string;
    };
  };
  referral_drafts: {
    key: string;
    value: ReferralDraft;
    indexes: {
      'by-patientId': string;
      'by-createdAt': string;
    };
  };
  offline_queue: {
    key: string;
    value: OfflineAction;
    indexes: {
      'by-timestamp': string;
    };
  };
  medicines_cache: {
    key: string;
    value: MedicineStock;
  };
  followups_cache: {
    key: string;
    value: FollowUpTask;
  };
}

// ============================================================================
// INDEXEDDB WRAPPER CLASS WITH IN-MEMORY RESILIENCE FALLBACK
// ============================================================================

export class SaathiOfflineDB {
  private dbPromise: Promise<IDBPDatabase<SaathiDBSchema>> | null = null;
  private isAvailable: boolean = true;

  // In-memory fallback stores (for sandboxed iframes or private browsing)
  private memPatients: Map<string, Patient> = new Map();
  private memTriage: Map<string, OfflineTriageData> = new Map();
  private memReferrals: Map<string, ReferralDraft> = new Map();
  private memQueue: Map<string, OfflineAction> = new Map();
  private memMedicines: Map<string, MedicineStock> = new Map();
  private memFollowUps: Map<string, FollowUpTask> = new Map();

  /**
   * Initializes or returns the cached `idb` database promise.
   * Gracefully degrades to memory storage if IndexedDB is blocked.
   */
  public async getDB(): Promise<IDBPDatabase<SaathiDBSchema> | null> {
    if (!this.isAvailable) {
      return null;
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    if (typeof window === 'undefined' || !window.indexedDB) {
      this.isAvailable = false;
      return null;
    }

    try {
      this.dbPromise = openDB<SaathiDBSchema>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // 1. Patient Registrations Store
          if (!db.objectStoreNames.contains('patients')) {
            const patientStore = db.createObjectStore('patients', { keyPath: 'id' });
            patientStore.createIndex('by-village', 'village');
            patientStore.createIndex('by-riskLevel', 'riskLevel');
            patientStore.createIndex('by-registeredAt', 'registeredAt');
          }

          // 2. Triage & Vitals Data Store
          if (!db.objectStoreNames.contains('triage_records')) {
            const triageStore = db.createObjectStore('triage_records', { keyPath: 'id' });
            triageStore.createIndex('by-patientId', 'patientId');
            triageStore.createIndex('by-recordedAt', 'recordedAt');
          }

          // 3. Referral Drafts Store
          if (!db.objectStoreNames.contains('referral_drafts')) {
            const refStore = db.createObjectStore('referral_drafts', { keyPath: 'id' });
            refStore.createIndex('by-patientId', 'patientId');
            refStore.createIndex('by-createdAt', 'createdAt');
          }

          // 4. Offline Action Queue Store
          if (!db.objectStoreNames.contains('offline_queue')) {
            const queueStore = db.createObjectStore('offline_queue', { keyPath: 'id' });
            queueStore.createIndex('by-timestamp', 'timestamp');
          }

          // 5. Medicines Cache Store
          if (!db.objectStoreNames.contains('medicines_cache')) {
            db.createObjectStore('medicines_cache', { keyPath: 'id' });
          }

          // 6. Follow-ups Cache Store
          if (!db.objectStoreNames.contains('followups_cache')) {
            db.createObjectStore('followups_cache', { keyPath: 'id' });
          }
        },
        blocked() {
          console.warn('[OfflineDB] Upgrade blocked: another connection is open.');
        },
        blocking() {
          console.warn('[OfflineDB] Connection blocking another upgrade.');
        },
        terminated() {
          console.warn('[OfflineDB] Connection terminated abnormally.');
        }
      });

      const db = await this.dbPromise;
      return db;
    } catch (err) {
      console.warn('[OfflineDB] IndexedDB unavailable (running memory fallback):', err);
      this.isAvailable = false;
      this.dbPromise = null;
      return null;
    }
  }

  // ==========================================================================
  // PATIENT REGISTRATIONS METHODS
  // ==========================================================================

  /**
   * Stores a patient registration record in IndexedDB while offline or online.
   */
  public async savePatient(patient: Patient): Promise<void> {
    this.memPatients.set(patient.id, patient);
    try {
      const db = await this.getDB();
      if (db) {
        await db.put('patients', patient);
      }
    } catch (err) {
      console.debug('[OfflineDB] savePatient memory fallback used:', err);
    }
  }

  /**
   * Retrieves all stored patient registration records.
   */
  public async getPatients(): Promise<Patient[]> {
    try {
      const db = await this.getDB();
      if (db) {
        const idbPatients = await db.getAll('patients');
        if (idbPatients.length > 0) return idbPatients;
      }
    } catch (err) {
      console.debug('[OfflineDB] getPatients memory fallback used:', err);
    }
    return Array.from(this.memPatients.values());
  }

  /**
   * Retrieves a single patient registration by ID.
   */
  public async getPatientById(id: string): Promise<Patient | undefined> {
    try {
      const db = await this.getDB();
      if (db) {
        const idbPatient = await db.get('patients', id);
        if (idbPatient) return idbPatient;
      }
    } catch (err) {
      console.debug('[OfflineDB] getPatientById memory fallback used:', err);
    }
    return this.memPatients.get(id);
  }

  /**
   * Retrieves patients filtered by village.
   */
  public async getPatientsByVillage(village: string): Promise<Patient[]> {
    try {
      const db = await this.getDB();
      if (db) {
        return await db.getAllFromIndex('patients', 'by-village', village);
      }
    } catch (err) {
      console.debug('[OfflineDB] getPatientsByVillage memory fallback used:', err);
    }
    return Array.from(this.memPatients.values()).filter(p => p.village === village);
  }

  /**
   * Deletes a patient registration record.
   */
  public async deletePatient(id: string): Promise<void> {
    this.memPatients.delete(id);
    try {
      const db = await this.getDB();
      if (db) {
        await db.delete('patients', id);
      }
    } catch (err) {
      console.debug('[OfflineDB] deletePatient memory fallback used:', err);
    }
  }

  // ==========================================================================
  // TRIAGE DATA METHODS
  // ==========================================================================

  /**
   * Stores a triage record (vitals, symptoms, risk level) while offline.
   */
  public async saveTriageData(
    data: Omit<OfflineTriageData, 'id'> & { id?: string }
  ): Promise<OfflineTriageData> {
    const record: OfflineTriageData = {
      id: data.id || `triage-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      patientId: data.patientId,
      patientName: data.patientName,
      vitals: data.vitals,
      riskLevel: data.riskLevel,
      symptoms: data.symptoms,
      recordedAt: data.recordedAt,
      recordedByRole: data.recordedByRole,
      recordedByName: data.recordedByName,
      synced: data.synced ?? false
    };

    this.memTriage.set(record.id, record);

    try {
      const db = await this.getDB();
      if (db) {
        await db.put('triage_records', record);
      }
    } catch (err) {
      console.debug('[OfflineDB] saveTriageData memory fallback used:', err);
    }
    return record;
  }

  /**
   * Alias method for saving vitals/triage entry.
   */
  public async saveVitalsEntry(
    entry: Omit<OfflineVitalsEntry, 'id'> & { id?: string }
  ): Promise<OfflineVitalsEntry> {
    return this.saveTriageData(entry);
  }

  /**
   * Retrieves all triage records, optionally filtered by patient ID.
   */
  public async getTriageData(patientId?: string): Promise<OfflineTriageData[]> {
    try {
      const db = await this.getDB();
      if (db) {
        if (patientId) {
          const records = await db.getAllFromIndex('triage_records', 'by-patientId', patientId);
          if (records.length > 0) return records;
        } else {
          const records = await db.getAll('triage_records');
          if (records.length > 0) return records;
        }
      }
    } catch (err) {
      console.debug('[OfflineDB] getTriageData memory fallback used:', err);
    }

    const allMem = Array.from(this.memTriage.values());
    return patientId ? allMem.filter(r => r.patientId === patientId) : allMem;
  }

  /**
   * Alias for getTriageData.
   */
  public async getVitalsRecords(patientId?: string): Promise<OfflineVitalsEntry[]> {
    return this.getTriageData(patientId);
  }

  /**
   * Retrieves triage records that have not yet been synchronized with the cloud.
   */
  public async getUnsyncedTriageData(): Promise<OfflineTriageData[]> {
    const all = await this.getTriageData();
    return all.filter((r) => !r.synced);
  }

  /**
   * Marks a triage record as synchronized.
   */
  public async markTriageSynced(id: string): Promise<void> {
    const memRecord = this.memTriage.get(id);
    if (memRecord) {
      memRecord.synced = true;
    }

    try {
      const db = await this.getDB();
      if (db) {
        const record = await db.get('triage_records', id);
        if (record) {
          record.synced = true;
          await db.put('triage_records', record);
        }
      }
    } catch (err) {
      console.debug('[OfflineDB] markTriageSynced memory fallback used:', err);
    }
  }

  // ==========================================================================
  // REFERRAL DRAFTS METHODS
  // ==========================================================================

  /**
   * Stores a referral draft created by frontline or medical staff while offline.
   */
  public async saveReferralDraft(
    draft: Omit<ReferralDraft, 'id'> & { id?: string }
  ): Promise<ReferralDraft> {
    const record: ReferralDraft = {
      id: draft.id || `ref-draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      patientId: draft.patientId,
      patientName: draft.patientName,
      patientAge: draft.patientAge,
      patientGender: draft.patientGender,
      patientVillage: draft.patientVillage,
      fromFacilityId: draft.fromFacilityId,
      fromFacilityName: draft.fromFacilityName,
      toFacilityId: draft.toFacilityId,
      toFacilityName: draft.toFacilityName,
      specialistRequired: draft.specialistRequired,
      priority: draft.priority,
      provisionalDiagnosis: draft.provisionalDiagnosis,
      reason: draft.reason,
      clinicalNotes: draft.clinicalNotes,
      transportAssisted: draft.transportAssisted,
      createdAt: draft.createdAt || new Date().toISOString(),
      updatedAt: draft.updatedAt || new Date().toISOString(),
      isDraft: draft.isDraft ?? true,
      synced: draft.synced ?? false,
      referringDoctorName: draft.referringDoctorName,
      status: draft.status
    };

    this.memReferrals.set(record.id, record);

    try {
      const db = await this.getDB();
      if (db) {
        await db.put('referral_drafts', record);
      }
    } catch (err) {
      console.debug('[OfflineDB] saveReferralDraft memory fallback used:', err);
    }
    return record;
  }

  /**
   * Retrieves all referral drafts, optionally filtered by patient ID.
   */
  public async getReferralDrafts(patientId?: string): Promise<ReferralDraft[]> {
    try {
      const db = await this.getDB();
      if (db) {
        if (patientId) {
          const records = await db.getAllFromIndex('referral_drafts', 'by-patientId', patientId);
          if (records.length > 0) return records;
        } else {
          const records = await db.getAll('referral_drafts');
          if (records.length > 0) return records;
        }
      }
    } catch (err) {
      console.debug('[OfflineDB] getReferralDrafts memory fallback used:', err);
    }

    const allMem = Array.from(this.memReferrals.values());
    return patientId ? allMem.filter(r => r.patientId === patientId) : allMem;
  }

  /**
   * Retrieves a single referral draft by ID.
   */
  public async getReferralDraftById(id: string): Promise<ReferralDraft | undefined> {
    try {
      const db = await this.getDB();
      if (db) {
        const record = await db.get('referral_drafts', id);
        if (record) return record;
      }
    } catch (err) {
      console.debug('[OfflineDB] getReferralDraftById memory fallback used:', err);
    }
    return this.memReferrals.get(id);
  }

  /**
   * Deletes a referral draft by ID.
   */
  public async deleteReferralDraft(id: string): Promise<void> {
    this.memReferrals.delete(id);
    try {
      const db = await this.getDB();
      if (db) {
        await db.delete('referral_drafts', id);
      }
    } catch (err) {
      console.debug('[OfflineDB] deleteReferralDraft memory fallback used:', err);
    }
  }

  /**
   * Marks a referral draft as successfully synced and no longer a draft.
   */
  public async markReferralDraftSynced(id: string): Promise<void> {
    const memRecord = this.memReferrals.get(id);
    if (memRecord) {
      memRecord.synced = true;
      memRecord.isDraft = false;
    }

    try {
      const db = await this.getDB();
      if (db) {
        const record = await db.get('referral_drafts', id);
        if (record) {
          record.synced = true;
          record.isDraft = false;
          await db.put('referral_drafts', record);
        }
      }
    } catch (err) {
      console.debug('[OfflineDB] markReferralDraftSynced memory fallback used:', err);
    }
  }

  // ==========================================================================
  // OFFLINE MUTATION QUEUE
  // ==========================================================================

  /**
   * Enqueues an offline action into the sync queue.
   */
  public async enqueueOfflineAction(
    actionType: OfflineAction['actionType'],
    payload: any
  ): Promise<OfflineAction> {
    const action: OfflineAction = {
      id: `idb-act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      actionType,
      payload,
      timestamp: new Date().toISOString(),
      synced: false
    };

    this.memQueue.set(action.id, action);

    try {
      const db = await this.getDB();
      if (db) {
        await db.put('offline_queue', action);
      }
    } catch (err) {
      console.debug('[OfflineDB] enqueueOfflineAction memory fallback used:', err);
    }
    return action;
  }

  /**
   * Retrieves all pending actions awaiting synchronization.
   */
  public async getPendingOfflineActions(): Promise<OfflineAction[]> {
    try {
      const db = await this.getDB();
      if (db) {
        const all = await db.getAll('offline_queue');
        if (all.length > 0) return all.filter((a) => !a.synced);
      }
    } catch (err) {
      console.debug('[OfflineDB] getPendingOfflineActions memory fallback used:', err);
    }
    return Array.from(this.memQueue.values()).filter(a => !a.synced);
  }

  /**
   * Removes or marks an action as synchronized.
   */
  public async markActionSynced(actionId: string): Promise<void> {
    this.memQueue.delete(actionId);
    try {
      const db = await this.getDB();
      if (db) {
        await db.delete('offline_queue', actionId);
      }
    } catch (err) {
      console.debug('[OfflineDB] markActionSynced memory fallback used:', err);
    }
  }

  /**
   * Clears all actions from the offline queue.
   */
  public async clearOfflineQueue(): Promise<void> {
    this.memQueue.clear();
    try {
      const db = await this.getDB();
      if (db) {
        await db.clear('offline_queue');
      }
    } catch (err) {
      console.debug('[OfflineDB] clearOfflineQueue memory fallback used:', err);
    }
  }

  // ==========================================================================
  // CACHE METHODS (MEDICINES & FOLLOW-UPS)
  // ==========================================================================

  public async cacheMedicines(items: MedicineStock[]): Promise<void> {
    items.forEach(item => this.memMedicines.set(item.id, item));
    try {
      const db = await this.getDB();
      if (db) {
        const tx = db.transaction('medicines_cache', 'readwrite');
        await Promise.all([...items.map((item) => tx.store.put(item)), tx.done]);
      }
    } catch (err) {
      console.debug('[OfflineDB] cacheMedicines memory fallback used:', err);
    }
  }

  public async getCachedMedicines(): Promise<MedicineStock[]> {
    try {
      const db = await this.getDB();
      if (db) {
        const items = await db.getAll('medicines_cache');
        if (items.length > 0) return items;
      }
    } catch (err) {
      console.debug('[OfflineDB] getCachedMedicines memory fallback used:', err);
    }
    return Array.from(this.memMedicines.values());
  }

  public async cacheFollowUps(items: FollowUpTask[]): Promise<void> {
    items.forEach(item => this.memFollowUps.set(item.id, item));
    try {
      const db = await this.getDB();
      if (db) {
        const tx = db.transaction('followups_cache', 'readwrite');
        await Promise.all([...items.map((item) => tx.store.put(item)), tx.done]);
      }
    } catch (err) {
      console.debug('[OfflineDB] cacheFollowUps memory fallback used:', err);
    }
  }

  public async getCachedFollowUps(): Promise<FollowUpTask[]> {
    try {
      const db = await this.getDB();
      if (db) {
        const items = await db.getAll('followups_cache');
        if (items.length > 0) return items;
      }
    } catch (err) {
      console.debug('[OfflineDB] getCachedFollowUps memory fallback used:', err);
    }
    return Array.from(this.memFollowUps.values());
  }

  /**
   * Calculates total count and breakdown of unsynced records across all stores in IndexedDB.
   */
  public async getUnsyncedSummary(): Promise<{
    total: number;
    pendingActions: number;
    unsyncedTriage: number;
    unsyncedReferrals: number;
  }> {
    try {
      const [pendingActions, unsyncedTriage, drafts] = await Promise.all([
        this.getPendingOfflineActions(),
        this.getUnsyncedTriageData(),
        this.getReferralDrafts()
      ]);
      const unsyncedReferrals = drafts.filter((d) => !d.synced).length;
      const actionCount = pendingActions.length;
      const triageCount = unsyncedTriage.length;
      const referralCount = unsyncedReferrals;
      const total = Math.max(actionCount, triageCount + referralCount);

      return {
        total: total > 0 ? total : actionCount,
        pendingActions: actionCount,
        unsyncedTriage: triageCount,
        unsyncedReferrals: referralCount
      };
    } catch (err) {
      console.warn('[OfflineDB] getUnsyncedSummary error:', err);
      return { total: 0, pendingActions: 0, unsyncedTriage: 0, unsyncedReferrals: 0 };
    }
  }

  /**
   * Marks all pending records across IndexedDB as synced when cloud connection is restored.
   */
  public async markAllSynced(): Promise<number> {
    let syncedCount = 0;
    try {
      const [pendingActions, unsyncedTriage, drafts] = await Promise.all([
        this.getPendingOfflineActions(),
        this.getUnsyncedTriageData(),
        this.getReferralDrafts()
      ]);

      syncedCount = Math.max(pendingActions.length, unsyncedTriage.length + drafts.filter(d => !d.synced).length);

      for (const t of unsyncedTriage) {
        await this.markTriageSynced(t.id);
      }

      for (const d of drafts) {
        if (!d.synced) {
          await this.markReferralDraftSynced(d.id);
        }
      }

      await this.clearOfflineQueue();
    } catch (err) {
      console.warn('[OfflineDB] markAllSynced error:', err);
    }
    return syncedCount;
  }

  /**
   * Clears all offline tables.
   */
  public async clearAllLocalData(): Promise<void> {
    this.memPatients.clear();
    this.memTriage.clear();
    this.memReferrals.clear();
    this.memQueue.clear();
    this.memMedicines.clear();
    this.memFollowUps.clear();

    try {
      const db = await this.getDB();
      if (db) {
        const tx = db.transaction(
          ['patients', 'triage_records', 'referral_drafts', 'offline_queue', 'medicines_cache', 'followups_cache'],
          'readwrite'
        );
        await Promise.all([
          tx.objectStore('patients').clear(),
          tx.objectStore('triage_records').clear(),
          tx.objectStore('referral_drafts').clear(),
          tx.objectStore('offline_queue').clear(),
          tx.objectStore('medicines_cache').clear(),
          tx.objectStore('followups_cache').clear(),
          tx.done
        ]);
      }
    } catch (err) {
      console.debug('[OfflineDB] clearAllLocalData memory fallback used:', err);
    }
  }
}

// Global singleton instance for application-wide use
export const offlineDB = new SaathiOfflineDB();
