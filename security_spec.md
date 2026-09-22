# Saathi Care — Security Specification & Threat Model (TDD)

## 1. System Overview & Security Invariants

Saathi Care is a mission-critical public health platform connecting rural citizens, frontline ASHA workers, Primary Health Centres (PHCs), and tertiary referral hospitals. Because this platform processes Protected Health Information (PHI) and clinical decisions, it adheres to the **Principle of Least Privilege (PoLP)** and zero-trust verification.

### Core Data Invariants:
1. **Confidentiality of PHI**: No healthcare records (patients, consultations, triage, diagnostics) may be read by unauthenticated or unauthorized users.
2. **Attribution & Accountability**: Every mutation must be attributable to an authenticated user with a verified role (`admin`, `doctor`, `frontline`, `facility`, `patient`).
3. **Audit Log Immutability**: The `auditLogs` collection is strictly append-only. No client-side or non-admin user may modify, overwrite, or delete audit records.
4. **Clinical Integrity**: Medical diagnoses, prescriptions, and referral authorizations may only be committed or modified by verified clinicians (`doctor`, `admin`).
5. **Inventory Traceability**: Medicine stock updates are strictly restricted to pharmacy and facility staff (`facility`, `admin`).
6. **Air-Gapped AI Secrets**: The Gemini API key (`GEMINI_API_KEY`) is stored exclusively server-side in container environment secrets. Frontend clients interface with AI triage solely via authenticated Express `/api/*` endpoints.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Resource / Collection | Patient | Frontline (ASHA) | Doctor | Facility / Lab | Admin |
|---|---|---|---|---|---|
| **patients** | Read own; Create new | Read assigned; Register | Read facility; Update clinical | Read facility patients | Full Read/Write |
| **queue** | Read own status; Join queue | Read local queue; Register entry | Read/Update consultation status | Read/Update queue status | Full Read/Write |
| **consultations** | Read own consultations | Read assigned patient summaries | Read/Write clinical notes & Rx | Read relevant facility cases | Full Read/Write |
| **referrals** | Read own referrals | Read assigned patient referrals | Create referral; Read/Update | Accept / Schedule / Complete | Full Read/Write |
| **diagnostics** | Read own test results | Read assigned patient orders | Order test; Review results | Update status; Upload lab findings | Full Read/Write |
| **medicines** | Read available stock | Read local dispensary stock | Read / Prescribe | Update physical stock counts | Full Read/Write |
| **followUps** | Read own scheduled visits | Read & Complete assigned visits | Prescribe follow-up regimen | Monitor facility follow-ups | Full Read/Write |
| **notifications** | Read own user notifications | Read frontline alerts | Read clinical alerts | Read facility alerts | Full Read/Write |
| **auditLogs** | *No access* | *No direct write* (API only) | *No direct write* (API only) | *No direct write* (API only) | Read / Server Append Only |

---

## 3. The "Dirty Dozen" Test Payloads & Attack Scenarios

### Attack 1: Unauthenticated PHI Extraction
- **Vector**: Direct unauthenticated `GET /api/appointments` or unauthenticated Firestore read on `/patients/{patientId}`.
- **Expected Outcome**: `401 Unauthorized` with structured JSON error `{ error: "Unauthorized: Missing authentication token" }` or Firestore rule rejection (`Missing or insufficient permissions`).

### Attack 2: Cross-Patient IDOR (Insecure Direct Object Reference)
- **Vector**: Patient A (`pat-001`) requests or attempts to modify Patient B's (`pat-002`) health card via `PUT /api/patients/pat-002`.
- **Expected Outcome**: `403 Forbidden` (`User cannot access or modify records of another citizen`).

### Attack 3: Frontline Privilege Escalation to Clinician Prescriptions
- **Vector**: Frontline ASHA worker sends `POST /api/consultations` with unauthorized prescription medications or clinical discharge codes.
- **Expected Outcome**: `403 Forbidden: Insufficient permissions. Required roles: doctor, admin`.

### Attack 4: Audit Log Manipulation / Tampering
- **Vector**: Client submits `DELETE /api/audit/log-123` or Firestore client `deleteDoc(doc(db, "auditLogs", "log-123"))`.
- **Expected Outcome**: Firestore rule rejection (`allow delete: if false;`). API returns `405 Method Not Allowed` or `403 Forbidden`.

### Attack 5: Triage Vital Injection / Parameter Smuggling
- **Vector**: Malformed vitals payload: `{ systolic: "120; DROP TABLE patients;", diastolic: -999, pulse: "NaN" }`.
- **Expected Outcome**: Input schema validation rejection (`400 Bad Request: Invalid vitals bounds. Systolic must be between 40 and 300 mmHg`).

### Attack 6: Role Claim Forgery in Unverified Headers
- **Vector**: Attacker sends `x-demo-mode: false` with forged `x-user-role: admin` on production instance without valid Firebase bearer token.
- **Expected Outcome**: Server verifies cryptographic signature of Firebase JWT via `firebaseAdmin.auth().verifyIdToken()`; rejects forged header with `401 Unauthorized`.

### Attack 7: Unauthorized Deletion of Active Referrals
- **Vector**: Unauthorized actor attempts to erase emergency referral `ref-001` to cover up SLA breach.
- **Expected Outcome**: Deletions disabled or restricted to `admin` with immutable audit log event generated.

### Attack 8: Direct Database Write Bypassing Server Middleware
- **Vector**: Compromised web client uses Firebase Web SDK directly to write to `/medicines` or `/facilities`.
- **Expected Outcome**: Firestore Security Rules block write unless `request.auth != null && request.auth.token.role in ['facility', 'admin']`.

### Attack 9: Malicious Inventory Drain / Stock Falsification
- **Vector**: Unauthorized actor submits `PATCH /api/medicines/med-001` with `quantity: 0` to simulate emergency stock-out.
- **Expected Outcome**: `403 Forbidden: Insufficient permissions. Required role: facility or admin`.

### Attack 10: Denial-of-Service / SOS Panic Flood
- **Vector**: Script rapidly triggers `POST /api/emergency/escalate` 500 times in 10 seconds.
- **Expected Outcome**: Rate limiting and role verification prevent denial of service and ensure authentic dispatcher connectivity.

### Attack 11: Client Bundle Secret Leakage (Gemini API Key)
- **Vector**: Inspect client bundle JS searching for `AIzaSy...` or `GEMINI_API_KEY`.
- **Expected Outcome**: Zero secrets in client-side bundle. All Gemini model calls are executed exclusively within `/server/routes/ai.ts` or `/server/server.ts`.

### Attack 12: Inter-Facility Cross-Tenant Data Corruption
- **Vector**: Facility A staff attempts to reschedule or divert Referral assigned to Facility B without authorization.
- **Expected Outcome**: Verification that modifying facility matches referral `toFacilityId` or user holds district `admin` privilege.

---

## 4. Verification Protocol
1. Run `npm test` or rule emulator tests against `firestore.rules`.
2. Verify API routes enforce `requireRole` and return structured HTTP status codes (`400`, `401`, `403`, `404`, `500`).
3. Check `metadata.json` has `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`.
4. Inspect dev server `/api/health` returns `{ status: "ok", firestore: "healthy", mode: "live" }`.
