# MediTrack — Compilation Record

## Project Setup

- **Stack:** Express 5 + TypeScript + Prisma 7 + PostgreSQL
- **Entry:** `src/server.ts` → `src/app.ts`
- **Config:** `src/config/env.ts` (env loading + validation), `src/config/prisma.ts` (PrismaClient singleton)
- **Prisma:** Multi-file schema under `prisma/schema/` (11 files: schema, enum, admin, receptionist, patient, doctor, appointment, medical_record, diagnosis, prescription, claim)
- **Auth:** JWT-based, middleware at `src/middleware/auth.middleware.ts`

---

## Files Created / Modified

### Prisma Schema (`prisma/schema/`)

Updated to match `planning.md` Section 4. All models use `uuid()`, direct `email`+`password` fields (no `User` table), no `updatedAt`/`isActive`/`deactivatedAt`.

| File | Models | Status |
|---|---|---|
| `schema.prisma` | Generator + datasource (PostgreSQL) | ✅ |
| `enum.prisma` | AppointmentStatus, InsuranceClaimStatus only | ✅ |
| `admin.prisma` | Admin (id, name, email, password) | ✅ NEW |
| `receptionist.prisma` | Receptionist (id, name, email, password) | ✅ NEW |
| `patient.prisma` | Patient (direct email/password, dateOfBirth, phone) | ✅ REWRITTEN |
| `doctor.prisma` | Doctor (direct email/password, gender String, records relation) | ✅ REWRITTEN |
| `appointment.prisma` | Appointment (scheduledAt, no MedicalRecord relation) | ✅ REWRITTEN |
| `medical_record.prisma` | MedicalRecord (has doctorId, no appointmentId, notes) | ✅ REWRITTEN |
| `diagnosis.prisma` | Diagnosis (recordId, notes, no code) | ✅ REWRITTEN |
| `prescription.prisma` | Prescription (no status, no updatedAt) | ✅ REWRITTEN |
| `claim.prisma` | InsuranceClaim (core fields only) | ✅ REWRITTEN |

**Deleted:** `user.prisma`, `refreshToken.prisma`, `notification.prisma` (not in planning.md Section 4)

### Config (`src/config/`)

| File | Purpose |
|---|---|
| `env.ts` | Loads dotenv, `getEnv()` validates required vars with fallbacks |
| `prisma.ts` | PrismaClient singleton with PrismaPg adapter (moved from `src/lib/prisma.ts`) |

**Deleted:** `src/config/db.ts` (replaced by prisma.ts), `src/lib/prisma.ts` (moved to config)

### Middleware (`src/middleware/`)

| File | Purpose |
|---|---|
| `auth.middleware.ts` | JWT verification only — extracts token, verifies, attaches `{ email, id, role }` to `req.user`. No role checking |
| `role.middleware.ts` | `requireRole()` guard — checks `req.user.role` against allowed roles. Returns 401/403 | ✅ NEW |
| `error.middleware.ts` | Global error handler. Classifies Prisma errors (P2002, P2025, P2003) and common messages into proper HTTP codes |
| `validate.middleware.ts` | Request body validation via `ValidationSchema` (field → validator fn), returns 422 on failure |

**Deleted:** `session.middleware.ts` (auth middleware handles JWT verification alone)

### Types (`src/types/`)

| File | Purpose |
|---|---|
| `express.d.ts` | Extends `Express.Request` with `{ user?: { email, id, role } }` | ✅ NEW |

### Shared Utilities (`src/shared/utills/`)

| File | Purpose |
|---|---|
| `asyncHandler.ts` | Wraps async route handlers, forwards errors to `next(error)` |
| `apiResponse.ts` | Standardized `sendResponse()` with success/statusCode/message/data/meta |
| `jwt.utils.ts` | JWT `verifyToken` and `decodeToken` only (token issuing lives in auth.service.ts) | ✅ NEW |
| `logger.ts` | Retained for backwards compatibility (`createToken` + `verifyToken`) |

**Deleted:** `errors/ApiError.ts`, `errors/errorCodes.ts`, `constants/role.ts`, `constants/statuses.ts` (empty stubs)

### Routes (`src/routes/`)

| File | Purpose |
|---|---|
| `index.ts` | Central router aggregator. Mounts all module routes under `/api` |

### Modules

#### Auth (`src/modules/auth/`)

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/auth/register` | POST | Public | Patient self-signup only (hashes password, issues JWT) |
| `/api/auth/login` | POST | Public | Shared login for Doctor/Patient/Receptionist — checks each model in turn, issues JWT |
| `/api/auth/admin/signup` | POST | Public | Create Admin account (checks email uniqueness, hashes password, issues JWT) |
| `/api/auth/admin/login` | POST | Public | Separate admin login track — checks Admin model only, issues JWT |

#### Admin (`src/modules/admin/`) — ✅ NEW

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/admin/users` | GET | ADMIN | List all users across Patient/Doctor/Receptionist models (filters by `?role=`) |
| `/api/admin/users/:role` | POST | ADMIN | Create user of a given role (checks email uniqueness) |
| `/api/admin/users/:role/:id` | PUT | ADMIN | Update user fields (checks existence) |
| `/api/admin/users/:role/:id` | DELETE | ADMIN | Delete user (checks existence) |
| `/api/admin/analytics/demographics` | GET | ADMIN | Patient count grouped by gender |
| `/api/admin/analytics/diagnoses` | GET | ADMIN | Top 10 most common diagnosis conditions |
| `/api/admin/analytics/appointments` | GET | ADMIN | Monthly appointment volume trends |

#### Doctors (`src/modules/doctors/`)

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/doctors` | GET | PATIENT, RECEPTIONIST, ADMIN | List doctors (filter by specialty, paginated) |
| `/api/doctors/:id` | GET | PATIENT, RECEPTIONIST, DOCTOR, ADMIN | View doctor profile |

**Removed:** `/:id/availability` endpoint (scheduleConfig field removed from Doctor model)

#### Patients (`src/modules/patients/`)

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/patients` | GET | RECEPTIONIST, ADMIN | List/browse patients (paginated) |
| `/api/patients/search` | GET | DOCTOR, RECEPTIONIST | Search by name, condition (diagnosis), medication (prescription) |
| `/api/patients/:id` | GET | PATIENT(self), DOCTOR(assigned), RECEPTIONIST, ADMIN | View patient profile + recent appointments |
| `/api/patients/:id` | PATCH | PATIENT(self limited), ADMIN(full) | Update profile |

#### Appointments (`src/modules/appointments/`)

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/appointments` | GET | DOCTOR(own), RECEPTIONIST, ADMIN | List appointments with filters (date, doctor, status) |
| `/api/appointments` | POST | PATIENT, RECEPTIONIST | Book appointment (conflict check on doctorId+scheduledAt) |
| `/api/appointments/:id` | PATCH | PATIENT(own), RECEPTIONIST | Reschedule / cancel |
| `/api/appointments/override` | POST | RECEPTIONIST | Force-book over conflict (bypasses check, requires reason) |
| `/api/appointments/:id/check-in` | POST | RECEPTIONIST | BOOKED → CHECKED_IN |
| `/api/appointments/:id/check-out` | POST | RECEPTIONIST | CHECKED_IN → COMPLETED |

#### Medical Records (`src/modules/medical-records/`)

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/patients/:id/history` | GET | PATIENT(self), DOCTOR(assigned) | View full patient history (appointments, records, prescriptions) |
| `/api/patients/:id/records` | POST | DOCTOR | Create medical record (visit notes) |

#### Diagnoses (`src/modules/diagnoses/`)

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/records/:id/diagnoses` | POST | DOCTOR | Add diagnosis to a medical record |

---

## Bugfixes Applied

1. **Config env var mismatch** — config read uppercase keys, .env had lowercase. Fixed in `env.ts`
2. **Duplicate dotenv loads** — `server.ts` and `lib/prisma.ts` had `import "dotenv/config"` while `config/env.ts` already loads it. Removed duplicates
3. **`catchAsync`** — was returning hardcoded 500 with "Failed to register user". Changed to `next(error)`
4. **Auth middleware** — `findUnique({ id, email, name, role })` was invalid. Changed to `findUnique({ id })`
5. **Prisma client imports** — `lib/prisma.ts` now imports `config.DATABASE_URL` instead of raw `process.env`
6. **`app.ts`** — removed broken `postRoutes`/`commentRoutes` imports (modules didn't exist)
7. **Appointment override route** — `POST /:id/override` had unused `:id` param. Changed to `POST /override`
8. **Misspelled directory** — `appoinments/` → `appointments/`
9. **Patient search** — extended to support `condition` (diagnosis) and `medication` (prescription) per planning.md
10. **`server.ts`** — `PORT` variable was removed during refactor but `app.listen(PORT)` still referenced it. Fixed to `config.PORT`
11. **Prisma schema rewrite** — Removed `User`/`RefreshToken`/`Notification` models, added `Admin`/`Receptionist`, aligned all fields with `planning.md`
12. **Auth module restructured** — Moved from `src/auth/` to `src/modules/auth/`, removed `User` model dependency, no refresh-token rotation
13. **Auth/RBAC split** — `auth.middleware.ts` now handles JWT verification only; `role.middleware.ts` handles `requireRole()` guard
14. **`app.ts`/`server.ts` imports** — Changed `config` import from `./config/prisma` to `./config/env` (prisma.ts is now PrismaClient)
15. **Config re-export** — Removed `src/config/db.ts` which just re-exported env.ts
16. **Auth endpoint naming** — `signup` → `register` to match planning.md Section 3 (`POST /api/auth/register`)
17. **Admin login** — Added `POST /api/auth/admin/login` with separate Admin-only login track per planning.md Section 3
18. **Admin listUsers role filter** — Fixed bug where `role=DOCTOR`/`role=RECEPTIONIST` returned empty instead of filtering
19. **Admin createUser** — Added email uniqueness check across Patient/Doctor/Receptionist models before creating
20. **Admin updateUser/deleteUser** — Added existence checks before operating (throws descriptive error instead of raw Prisma error)
21. **Admin signup** — Added `POST /api/auth/admin/signup` to create admin accounts via the auth module

---

## Verification

`npx tsc --noEmit` passes with **zero errors**.

All source files compile cleanly under TypeScript strict mode (ES2023 target, bundler module resolution).

`npx prisma validate --config prisma.config.ts` — schema valid.
