# MediTrack — Compilation Record

## Project Setup

- **Stack:** Express 5 + TypeScript + Prisma 7 + PostgreSQL
- **Entry:** `src/server.ts` → `src/app.ts`
- **Config:** `src/config/env.ts` (env loading + validation) → `src/config/db.ts` (re-exports, used by all imports)
- **Prisma:** Multi-file schema under `prisma/schema/` (11 files: schema, enum, user, patient, doctor, appointment, medical_record, diagnosis, prescription, claim, notification)
- **Auth:** JWT-based, middleware at `src/middleware/auth.middleware.ts`

---

## Files Created / Modified

### Prisma Schema (`prisma/schema/`)

| File | Models | Status |
|---|---|---|
| `schema.prisma` | Generator + datasource (PostgreSQL) | ✅ |
| `enum.prisma` | Role, Gender, AppointmentStatus, PrescriptionStatus, InsuranceClaimStatus, NotificationType, NotificationChannel, NotificationStatus | ✅ |
| `user.prisma` | User (id, email, passwordHash, role, isActive, deactivatedAt) | ✅ |
| `patient.prisma` | Patient (linked to User, has name, dob, gender, contactInfo, demographics) | ✅ |
| `doctor.prisma` | Doctor (linked to User, has specialty, scheduleConfig) | ✅ |
| `appointment.prisma` | Appointment (links Patient+Doctor, status lifecycle) | ✅ |
| `medical_record.prisma` | MedicalRecord (1:1 with Appointment via unique appointmentId) | ✅ |
| `diagnosis.prisma` | Diagnosis (belongs to MedicalRecord, optional ICD-10 code) | ✅ |
| `prescription.prisma` | Prescription (links Patient+Doctor+optional Diagnosis) | ✅ |
| `claim.prisma` | Claim (1:1 with Appointment, InsuranceClaimStatus) | ✅ |
| `notification.prisma` | Notification (links to User, scheduling support) | ✅ |

### Config (`src/config/`)

| File | Purpose |
|---|---|
| `env.ts` | Loads dotenv, `getEnv()` validates required vars with fallbacks |
| `db.ts` | Re-exports env.ts (all imports point here) |

### Middleware (`src/middleware/`)

| File | Purpose |
|---|---|
| `auth.middleware.ts` | JWT verification + RBAC role check. Attaches `{ email, id, role }` to `req.user` |
| `error.middleware.ts` | Global error handler. Classifies Prisma errors (P2002, P2025, P2003) and common messages into proper HTTP codes |
| `session.middleware.ts` | Lightweight session validator — verifies JWT exists and user is active, no role enforcement |
| `validate.middleware.ts` | Request body validation via `ValidationSchema` (field → validator fn), returns 422 on failure |

### Routes (`src/routes/`)

| File | Purpose |
|---|---|
| `index.ts` | Central router aggregator. Mounts all module routes under `/api/v1` |

### Modules

#### Users (`src/modules/users/`)

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/v1/users` | GET | ADMIN | List/search accounts with pagination & filters |
| `/api/v1/users` | POST | ADMIN | Create account (auto-creates Patient/Doctor profile via transaction) |
| `/api/v1/users/:id` | PATCH | ADMIN | Edit email, role, password, deactivate/reactivate |

#### Doctors (`src/modules/doctors/`)

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/v1/doctors` | GET | PATIENT, RECEPTIONIST, ADMIN | List doctors (filter by specialty, paginated) |
| `/api/v1/doctors/:id` | GET | PATIENT, RECEPTIONIST, DOCTOR, ADMIN | View doctor profile |
| `/api/v1/doctors/:id/availability` | GET | PATIENT, RECEPTIONIST | Available slots (reads scheduleConfig JSON, subtracts booked appointments) |

#### Patients (`src/modules/patients/`)

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/v1/patients` | GET | RECEPTIONIST, ADMIN | List/browse patients (paginated) |
| `/api/v1/patients/search` | GET | DOCTOR, RECEPTIONIST | Search by name, condition (diagnosis), medication (prescription) |
| `/api/v1/patients/:id` | GET | PATIENT(self), DOCTOR(assigned), RECEPTIONIST, ADMIN | View patient profile + recent appointments |
| `/api/v1/patients/:id` | PATCH | PATIENT(self limited), ADMIN(full) | Update profile (patient: contactInfo/demographics only; admin: all fields) |

#### Appointments (`src/modules/appointments/`)

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/v1/appointments` | GET | DOCTOR(own), RECEPTIONIST, ADMIN | List appointments with filters (date, doctor, status) |
| `/api/v1/appointments` | POST | PATIENT, RECEPTIONIST | Book appointment (conflict check on doctorId+datetime) |
| `/api/v1/appointments/:id` | PATCH | PATIENT(own), RECEPTIONIST | Reschedule / cancel (patients scoped to own) |
| `/api/v1/appointments/override` | POST | RECEPTIONIST | Force-book over conflict (bypasses check, requires reason) |
| `/api/v1/appointments/:id/check-in` | POST | RECEPTIONIST | BOOKED → CHECKED_IN |
| `/api/v1/appointments/:id/check-out` | POST | RECEPTIONIST | CHECKED_IN → COMPLETED |

---

## Shared Utilities (`src/shared/`)

| File | Purpose |
|---|---|
| `utils/asyncHandler.ts` | Wraps async route handlers, forwards errors to `next(error)` |
| `utils/apiResponse.ts` | Standardized `sendResponse()` with success/statusCode/message/data/meta |
| `utils/logger.ts` | JWT `createToken` and `verifyToken` utilities (misnamed logger) |
| `errors/ApiError.ts` | Empty stub for custom error class |
| `errors/errorCodes.ts` | Empty stub for error code constants |
| `constants/role.ts` | Empty stub for role constants |
| `constants/statuses.ts` | Empty stub for status constants |

---

## Empty Directories (Future Phases)

| Directory | Planning Section | Phase |
|---|---|---|
| `src/modules/medical-records/` | 3.4 Medical Records & Diagnoses | Phase 3 |
| `src/modules/diagnoses/` | 3.4 Medical Records & Diagnoses | Phase 3 |
| `src/modules/prescriptions/` | 3.5 Prescriptions | Phase 3 |
| `src/modules/claims/` | 3.6 Insurance Claims | Phase 4 |
| `src/modules/notifications/` | 3.8 Notifications | Phase 5 |
| `src/modules/ai/` | 3.10 AI-Assisted Feature | Phase 6 |
| `src/modules/search/` | 3.9 Search (handled in patients module) | Phase 3 |
| `src/integrations/email/` | Email provider (TBD) | Phase 5 |
| `src/integrations/sms/` | SMS provider (TBD) | Phase 5 |

---

## Bugfixes Applied

1. **Config env var mismatch** — config read uppercase keys, .env had lowercase. Fixed in `env.ts`
2. **Duplicate dotenv loads** — `server.ts` and `lib/prisma.ts` had `import "dotenv/config"` while `config/env.ts` already loads it. Removed duplicates
3. **`catchAsync`** — was returning hardcoded 500 with "Failed to register user". Changed to `next(error)`
4. **Auth middleware** — `findUnique({ id, email, name, role })` was invalid (findUnique only takes one field). Changed to `findUnique({ id })`. `activeStatus` → `isActive`. Removed `name` from `req.user` (User model has no name field)
5. **Auth service** — `user.password` → `user.passwordHash`. `user.activeStatus` → `user.isActive`. Removed `name` from JWT payload
6. **Prisma client imports** — `lib/prisma.ts` now imports `config.DATABASE_URL` instead of raw `process.env`
7. **`app.ts`** — removed broken `postRoutes`/`commentRoutes` imports (modules didn't exist)
8. **Appointment override route** — `POST /:id/override` had unused `:id` param. Changed to `POST /override`
9. **Misspelled directory** — `appoinments/` → `appointments/`
10. **Patient search** — extended to support `condition` (diagnosis) and `medication` (prescription) per planning.md Section 3.9
11. **`server.ts`** — `PORT` variable was removed during refactor but `app.listen(PORT)` still referenced it. Fixed to `config.PORT`

---

## Verification

`npx tsc --noEmit` passes with **zero errors**.

All 35 `.ts` source files compile cleanly under TypeScript strict mode (ES2023 target, bundler module resolution).
