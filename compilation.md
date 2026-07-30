# MediTrack — Compilation Record

## Project Setup

- **Stack:** Express 5 + TypeScript + Prisma 7 + PostgreSQL
- **Entry:** `src/server.ts` → `src/app.ts`
- **Config:** `src/config/env.ts` (env loading + validation), `src/config/prisma.ts` (PrismaClient singleton)
- **Prisma:** Multi-file schema under `prisma/schema/` (11 files)
- **Auth:** JWT-based, middleware at `src/middleware/auth.middleware.ts`

---

## Files Created / Modified

### Config (`src/config/`)

| File | Purpose |
|---|---|
| `env.ts` | Loads dotenv, `getEnv()` validates required vars with fallbacks |
| `prisma.ts` | PrismaClient singleton with PrismaPg adapter |

### Middleware (`src/middleware/`)

| File | Purpose |
|---|---|
| `auth.middleware.ts` | JWT verification — extracts token, verifies, attaches `{ email, id, role }` to `req.user` |
| `role.middleware.ts` | `requireRole()` guard — checks `req.user.role` against allowed roles, returns 401/403 |
| `error.middleware.ts` | Global error handler. Classifies Prisma errors (P2002, P2025, P2003) and common messages into proper HTTP codes |

### Types (`src/types/`)

| File | Purpose |
|---|---|
| `express.d.ts` | Extends `Express.Request` with `{ user?: { email, id, role } }` |

### Shared (`src/shared/`)

| File | Purpose |
|---|---|
| `utils/asyncHandler.ts` | Wraps async route handlers, forwards errors to `next(error)` |
| `utils/apiResponse.ts` | Standardized `sendResponse()` with success/statusCode/message/data/meta |
| `utils/jwt.utils.ts` | JWT `verifyToken` and `decodeToken` only (token issuing lives in auth.service.ts) |
| `utils/logger.ts` | Logger utility (`info`/`warn`/`error`/`debug`) |
| `constants/index.ts` | `Roles`, `AppointmentStatus`, `InsuranceClaimStatus` const objects + types |
| `errors/index.ts` | `AppError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `ValidationError` |

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
| `/api/auth/admin/login` | POST | Public | Separate admin login track — checks Admin model only, issues JWT |

**Note:** No `/api/auth/admin/signup` — admin accounts are provisioned outside the API (seed script), per planning.md Section 3.

#### Admin (`src/modules/admin/`)

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/admin/users` | GET | ADMIN | List all users (filters by `?role=`, `?search=`, paginated) |
| `/api/admin/users/:role` | POST | ADMIN | Create user of a given role (checks email uniqueness) |
| `/api/admin/users/:role/:id` | PUT | ADMIN | Update user fields |
| `/api/admin/users/:role/:id` | DELETE | ADMIN | Delete user |
| `/api/admin/analytics/demographics` | GET | ADMIN | Patient count grouped by gender |
| `/api/admin/analytics/diagnoses` | GET | ADMIN | Top 10 most common diagnosis conditions |
| `/api/admin/analytics/appointments` | GET | ADMIN | Monthly appointment volume trends |

#### Patients (`src/modules/patients/`)

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/patients/me` | GET | PATIENT | Get own profile |
| `/api/patients/me` | PUT | PATIENT | Update own profile |
| `/api/patients/me/appointments` | GET | PATIENT | List own upcoming appointments |
| `/api/patients/me/appointments` | POST | PATIENT | Book a new appointment (conflict check) |
| `/api/patients/me/appointments/:id` | PUT | PATIENT | Reschedule an appointment |
| `/api/patients/me/appointments/:id` | DELETE | PATIENT | Cancel an appointment |
| `/api/patients` | GET | RECEPTIONIST, ADMIN | List all patients (paginated) |
| `/api/patients/:id` | GET | PATIENT(self), DOCTOR(assigned), RECEPTIONIST, ADMIN | View patient profile |
| `/api/patients/:id` | PATCH | PATIENT(self limited), ADMIN(full) | Update patient |

#### Doctors (`src/modules/doctors/`)

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/doctors` | GET | PATIENT, DOCTOR, RECEPTIONIST, ADMIN | List doctors (filter by specialty, paginated) |
| `/api/doctors/me` | GET | DOCTOR | Get own profile |
| `/api/doctors/me` | PUT | DOCTOR | Update own profile |
| `/api/doctors/me/schedule` | GET | DOCTOR | View own daily/weekly schedule |
| `/api/doctors/me/appointments` | GET | DOCTOR | List own upcoming appointments |
| `/api/doctors/:id` | GET | PATIENT, RECEPTIONIST, DOCTOR, ADMIN | View doctor profile |

#### Receptionist (`src/modules/receptionist/`) — ✨ NEW

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/receptionist/appointments` | GET | RECEPTIONIST | View clinic-wide appointment calendar (date/doctor/status filters) |
| `/api/receptionist/appointments/:id` | PUT | RECEPTIONIST | Edit/override an appointment (conflict override) |
| `/api/receptionist/appointments/:id/check-in` | PUT | RECEPTIONIST | Check a patient in (BOOKED → CHECKED_IN) |
| `/api/receptionist/appointments/:id/check-out` | PUT | RECEPTIONIST | Check a patient out (CHECKED_IN → COMPLETED) |

#### Appointments (`src/modules/appointments/`)

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/appointments` | GET | DOCTOR(own), RECEPTIONIST, ADMIN | List appointments with filters (date, doctor, status) |
| `/api/appointments` | POST | PATIENT, RECEPTIONIST | Book appointment (conflict check) |
| `/api/appointments/:id` | PATCH | PATIENT(own), RECEPTIONIST | Reschedule / update status |
| `/api/appointments/:id` | DELETE | PATIENT(own), RECEPTIONIST | Cancel appointment |
| `/api/appointments/override` | POST | RECEPTIONIST | Force-book over conflict (requires reason) |
| `/api/appointments/:id/check-in` | POST | RECEPTIONIST | BOOKED → CHECKED_IN |
| `/api/appointments/:id/check-out` | POST | RECEPTIONIST | CHECKED_IN → COMPLETED |

#### Medical Records (`src/modules/medical-records/`)

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/medical-records/me` | GET | PATIENT | View own medical history (appointments, records, prescriptions) |
| `/api/medical-records/patient/:patientId` | GET | DOCTOR | View an assigned patient's full history |
| `/api/medical-records/patient/:patientId` | POST | DOCTOR | Add a new medical record (visit notes) |
| `/api/medical-records/:recordId/diagnoses` | POST | DOCTOR | Add a diagnosis to a record |

#### Prescriptions (`src/modules/prescriptions/`) — ✨ NEW

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/prescriptions/me` | GET | PATIENT | View own prescriptions |
| `/api/prescriptions/me/:id/refill` | POST | PATIENT | Request a prescription refill |
| `/api/prescriptions` | POST | DOCTOR | Create a new e-prescription |

#### Insurance (`src/modules/insurance/`)

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/insurance` | GET | RECEPTIONIST | List/track all claims |
| `/api/insurance` | POST | RECEPTIONIST | Submit an insurance claim |
| `/api/insurance/:id` | PUT | RECEPTIONIST | Update claim status |
| `/api/insurance/me` | GET | PATIENT | View own insurance claims |

#### Search (`src/modules/search/`) — ✨ NEW

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/search/patients?query=` | GET | DOCTOR, RECEPTIONIST | Search patients by name, diagnosed condition, or current medication |
| `/api/search/appointments?date=&doctorId=&status=` | GET | DOCTOR, RECEPTIONIST | Filter appointments by date, doctor, or status |

#### AI (`src/modules/ai/`) — ✨ NEW

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/ai/symptom-check` | POST | PATIENT | Submit symptoms (free text), receive suggested specialty + urgency level |

#### Notifications (`src/modules/notifications/`) — ✨ NEW

| Endpoint | Method | Roles | Purpose |
|---|---|---|---|
| `/api/notifications/me` | GET | Any authenticated user | List own reminders (upcoming appointments, role-aware) |
| `/api/notifications/trigger` | POST | ADMIN | Manually trigger a reminder run (scans next 24h appointments) |

---

## Module Structure Summary

All modules follow the planning.md Section 9 folder structure:

| Module | Controller | Service | Routes | Types | Extra |
|---|---|---|---|---|---|
| `auth` | ✅ | ✅ | ✅ | ✅ | — |
| `admin` | ✅ | ✅ | ✅ | ✅ | — |
| `patients` | ✅ | ✅ | ✅ | ✅ | — |
| `doctors` | ✅ | ✅ | ✅ | ✅ | — |
| `receptionist` | ✅ | ✅ | ✅ | ✅ | — |
| `appointments` | ✅ | ✅ | ✅ | ✅ | — |
| `medical-records` | ✅ | ✅ | ✅ | ✅ | `diagnosis.service.ts` nested |
| `prescriptions` | ✅ | ✅ | ✅ | ✅ | — |
| `insurance` | ✅ | ✅ | ✅ | ✅ | — |
| `search` | ✅ | ✅ | ✅ | ❌ (no types needed) | — |
| `ai` | ✅ | ✅ | ✅ | ❌ (no types needed) | — |
| `notifications` | ✅ | ✅ | ✅ | ❌ (no types needed) | `notification.scheduler.ts` |

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
9. **`server.ts`** — `PORT` variable was removed during refactor but `app.listen(PORT)` still referenced it. Fixed to `config.PORT`
10. **Prisma schema rewrite** — Removed `User`/`RefreshToken`/`Notification` models, added `Admin`/`Receptionist`, aligned all fields with `planning.md`
11. **Auth module restructured** — Moved from `src/auth/` to `src/modules/auth/`, removed `User` model dependency, no refresh-token rotation
12. **Auth/RBAC split** — `auth.middleware.ts` now handles JWT verification only; `role.middleware.ts` handles `requireRole()` guard
13. **`app.ts`/`server.ts` imports** — Changed `config` import from `./config/prisma` to `./config/env` (prisma.ts is now PrismaClient)
14. **Auth endpoint naming** — `signup` → `register` to match planning.md Section 3 (`POST /api/auth/register`)
15. **Admin login** — Added `POST /api/auth/admin/login` with separate Admin-only login track per planning.md Section 3
16. **Admin listUsers role filter** — Fixed bug where `role=DOCTOR`/`role=RECEPTIONIST` returned empty instead of filtering
17. **Admin createUser** — Added email uniqueness check across Patient/Doctor/Receptionist models before creating
18. **Admin updateUser/deleteUser** — Added existence checks before operating
19. **`logger.ts`** — was misnamed (contained JWT `createToken`/`verifyToken`). Replaced with proper logger utility
20. **`patient.service.ts`** — fixed nested relation name `medicalRecords` → `records` (Prisma schema uses `records`)
21. **`search.service.ts`** — fixed nested relation name `medicalRecords` → `records`
22. **Admin signup removed** — `POST /api/auth/admin/signup` removed per planning.md Section 3 (admin accounts provisioned outside API)
23. **Duplicate search removed** — Patient search moved from `patients/` module to dedicated `search/` module per planning.md Section 6.7

---

## Verification

`npx tsc --noEmit` passes with **zero errors**.

All source files compile cleanly under TypeScript strict mode (ES2023 target, bundler module resolution).

All API endpoints from planning.md Sections 6.1–6.10 are implemented and correctly mounted under `/api`.
