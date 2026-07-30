# MediTrack - API Documentation

## Base URL

```
http://localhost:5000
```

All API endpoints are prefixed with `/api` unless otherwise noted.

---

## Authentication & Authorization

### Auth Header / Token

JWT tokens are accepted via **either**:

1. **HTTP-Only Cookie** (set on login):
   - Name: `accessToken`
   - Sent automatically by the browser
2. **Authorization Header**:
   - `Authorization: Bearer <token>`
   - `Authorization: <token>` (raw token also accepted)

### Token Extraction Order (auth.middleware.ts)
1. `req.cookies.accessToken`
2. `req.headers.authorization` if it starts with `"Bearer "` → split and take part `[1]`
3. `req.headers.authorization` (raw)

### Roles
| Role | Value |
|------|-------|
| Admin | `ADMIN` |
| Doctor | `DOCTOR` |
| Patient | `PATIENT` |
| Receptionist | `RECEPTIONIST` |

### Role Guards
Endpoints use `requireRole(...roles)` middleware. If the user's role is not in the allowed list, a `403 Forbidden` is returned.

---

## Standard Response Format

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` |
| `statusCode` | number | HTTP status code |
| `message` | string | Human-readable message |
| `data` | object/array/null | Response payload |
| `meta` | object | Present only on paginated responses |

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `false` |
| `statusCode` | number | HTTP error status code |
| `message` | string | Error description |

---

## Error References

### HTTP Status Codes Used

| Code | Description | When |
|------|-------------|------|
| `200` | OK | Successful GET, PUT, PATCH, DELETE operations |
| `201` | Created | Successful POST operations (resource creation) |
| `400` | Bad Request | Invalid input, validation failure, foreign key failure (P2003) |
| `401` | Unauthorized | Missing/invalid JWT token, or `req.user` is undefined |
| `403` | Forbidden | User role not permitted for the endpoint |
| `404` | Not Found | Resource not found (Prisma P2025 or manual check) |
| `409` | Conflict | Duplicate email, unique constraint violation (Prisma P2002), conflicting appointment time slot |
| `500` | Internal Server Error | Unhandled exceptions |

### Error Message Patterns (error.middleware.ts)

| Condition | Status Code | Message |
|-----------|-------------|---------|
| Prisma P2002 | `409` | `"Unique constraint violation"` |
| Prisma P2025 | `404` | `"Record not found"` |
| Prisma P2003 | `400` | `"Foreign key constraint failed"` |
| Prisma ValidationError | `400` | `"Invalid data provided"` |
| Message contains `"already exists"` | `409` | The error's message text |
| Message contains `"not found"` | `404` | The error's message text |
| Message contains `"Invalid"` or `"required"` | `400` | The error's message text |
| Custom AppError subclasses | varies | Defined per error class |

### Custom Error Classes (shared/errors/index.ts)

| Class | Default Status | Default Message |
|-------|---------------|-----------------|
| `AppError` | Varies | Varies |
| `NotFoundError` | `404` | `"{Resource} not found"` |
| `UnauthorizedError` | `401` | `"Authentication required"` |
| `ForbiddenError` | `403` | `"You do not have permission to perform this action"` |
| `ConflictError` | `409` | `"Resource already exists"` |
| `ValidationError` | `400` | `"Invalid data provided"` |

---

## Enums

### AppointmentStatus
```
BOOKED | CHECKED_IN | COMPLETED | CANCELLED
```

### InsuranceClaimStatus
```
SUBMITTED | IN_REVIEW | APPROVED | REJECTED
```

---

## Endpoints

---

### 1. Health Check

#### `GET /`

No authentication required.

**Response** `200 OK`
```
Hello, World!
```

---

### 2. Auth Module — `/api/auth`

All auth endpoints are **public** (no auth middleware).

---

#### `POST /api/auth/register`

Patient self-registration.

**Request Body**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "gender": "male",
  "dateOfBirth": "1990-01-15",
  "phone": "+1234567890"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Patient's full name |
| `email` | string | Yes | Unique email address |
| `password` | string | Yes | Plain-text password (will be hashed) |
| `gender` | string | Yes | Gender value |
| `dateOfBirth` | string | Yes | ISO date string (e.g. `1990-01-15`) |
| `phone` | string | No | Phone number |

**Success Response** `201 Created`
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Account created successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "role": "PATIENT"
    }
  }
}
```

**Error Responses**
- `409 Conflict` — `"A user with this email already exists"`

---

#### `POST /api/auth/login`

Shared login for Patient, Doctor, and Receptionist roles.

**Request Body**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Registered email |
| `password` | string | Yes | Plain-text password |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "role": "PATIENT"
    }
  }
}
```

Also sets `accessToken` httpOnly cookie (secure: false, sameSite: none, maxAge: 24h).

**Error Responses**
- `401 Unauthorized` — `"Invalid email or password"`

---

#### `POST /api/auth/admin/signup`

Create an admin account.

**Request Body**
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "securePassword123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Admin's full name |
| `email` | string | Yes | Unique email |
| `password` | string | Yes | Plain-text password |

**Success Response** `201 Created`
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Admin account created successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  }
}
```

**Error Responses**
- `409 Conflict` — `"An admin with this email already exists"`

---

#### `POST /api/auth/admin/login`

Admin-specific login.

**Request Body**
```json
{
  "email": "admin@example.com",
  "password": "securePassword123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Admin email |
| `password` | string | Yes | Plain-text password |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Admin login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  }
}
```

Also sets `accessToken` httpOnly cookie.

**Error Responses**
- `401 Unauthorized` — `"Invalid admin credentials"`

---

### 3. Admin Module — `/api/admin`

All endpoints require `auth` + `requireRole("ADMIN")`.

---

#### `GET /api/admin/users`

List all users across roles with optional filtering and pagination.

**Query Parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | string | No | Filter by role: `PATIENT`, `DOCTOR`, or `RECEPTIONIST` |
| `search` | string | No | Search by name (case-insensitive contains) |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 10) |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "gender": "male",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "role": "PATIENT"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

---

#### `POST /api/admin/users/:role`

Create a user of a specific role.

**URL Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `role` | string | One of `PATIENT`, `DOCTOR`, `RECEPTIONIST` |

**Request Body**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securePassword123",
  "gender": "female",
  "dateOfBirth": "1995-05-20",
  "phone": "+1234567890",
  "specialty": "Cardiology"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Full name |
| `email` | string | Yes | Unique email |
| `password` | string | Yes | Plain-text password |
| `gender` | string | No | Required for PATIENT/DOCTOR (defaults to `OTHER`) |
| `dateOfBirth` | string | No | ISO date string (for PATIENT; defaults to now) |
| `phone` | string | No | Phone number (for PATIENT) |
| `specialty` | string | No | Medical specialty (for DOCTOR; defaults to `General`) |

**Success Response** `201 Created`
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "email": "jane@example.com"
  }
}
```

---

#### `PUT /api/admin/users/:role/:id`

Update a user by role and ID.

**URL Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `role` | string | One of `PATIENT`, `DOCTOR`, `RECEPTIONIST` |
| `id` | string | UUID of the user |

**Request Body** (all fields optional)
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "password": "newPassword",
  "gender": "male",
  "dateOfBirth": "1990-01-01",
  "phone": "+1987654321",
  "specialty": "Neurology"
}
```

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User updated successfully",
  "data": {
    "id": "uuid",
    "email": "updated@example.com"
  }
}
```

**Error Responses**
- `404 Not Found` — `"Patient not found"` / `"Doctor not found"` / `"Receptionist not found"`

---

#### `DELETE /api/admin/users/:role/:id`

Delete a user by role and ID.

**URL Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `role` | string | One of `PATIENT`, `DOCTOR`, `RECEPTIONIST` |
| `id` | string | UUID of the user |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User deleted successfully",
  "data": null
}
```

---

#### `GET /api/admin/analytics/demographics`

Patient demographics breakdown by gender.

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Demographics breakdown",
  "data": {
    "total": 100,
    "breakdown": {
      "male": 45,
      "female": 50,
      "OTHER": 5
    }
  }
}
```

---

#### `GET /api/admin/analytics/diagnoses`

Top 10 most common diagnosis conditions.

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Most common diagnoses",
  "data": [
    {
      "condition": "Hypertension",
      "count": 25
    },
    {
      "condition": "Diabetes Type 2",
      "count": 18
    }
  ]
}
```

---

#### `GET /api/admin/analytics/appointments`

Monthly appointment volume trends.

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Appointment volume trends",
  "data": {
    "volume": [
      {
        "month": "2025-01",
        "total": 120,
        "completed": 90,
        "cancelled": 10
      },
      {
        "month": "2025-02",
        "total": 135,
        "completed": 100,
        "cancelled": 15
      }
    ]
  }
}
```

---

### 4. Patient Module — `/api/patients`

---

#### `GET /api/patients/me`

Get the authenticated patient's own profile.

**Auth:** `auth` + `requireRole("PATIENT")`

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "gender": "male",
    "dateOfBirth": "1990-01-15T00:00:00.000Z",
    "phone": "+1234567890"
  }
}
```

---

#### `PUT /api/patients/me`

Update the authenticated patient's own profile.

**Auth:** `auth` + `requireRole("PATIENT")`

**Request Body** (all fields optional)
```json
{
  "phone": "+1987654321",
  "name": "John Updated",
  "gender": "male",
  "dateOfBirth": "1990-06-15"
}
```

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "name": "John Updated",
    "email": "john@example.com",
    "gender": "male",
    "dateOfBirth": "1990-06-15T00:00:00.000Z",
    "phone": "+1987654321"
  }
}
```

---

#### `GET /api/patients/me/appointments`

List the authenticated patient's upcoming appointments.

**Auth:** `auth` + `requireRole("PATIENT")`

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Appointments retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "patientId": "uuid",
      "doctorId": "uuid",
      "scheduledAt": "2025-06-15T10:00:00.000Z",
      "status": "BOOKED",
      "createdAt": "2025-06-01T00:00:00.000Z",
      "doctor": {
        "id": "uuid",
        "name": "Dr. Smith",
        "specialty": "Cardiology"
      }
    }
  ]
}
```

---

#### `POST /api/patients/me/appointments`

Book a new appointment as the authenticated patient.

**Auth:** `auth` + `requireRole("PATIENT")`

**Request Body**
```json
{
  "doctorId": "uuid",
  "scheduledAt": "2025-06-15T10:00:00.000Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `doctorId` | string | Yes | UUID of the doctor |
| `scheduledAt` | string | Yes | ISO date-time string |

**Success Response** `201 Created`
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Appointment booked successfully",
  "data": {
    "id": "uuid",
    "patientId": "uuid",
    "doctorId": "uuid",
    "scheduledAt": "2025-06-15T10:00:00.000Z",
    "status": "BOOKED",
    "createdAt": "2025-06-01T00:00:00.000Z",
    "doctor": {
      "id": "uuid",
      "name": "Dr. Smith",
      "specialty": "Cardiology"
    }
  }
}
```

**Error Responses**
- `409 Conflict` — `"Time slot already booked"`

---

#### `PUT /api/patients/me/appointments/:id`

Reschedule the patient's own appointment.

**Auth:** `auth` + `requireRole("PATIENT")`

**URL Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | UUID of the appointment |

**Request Body**
```json
{
  "scheduledAt": "2025-06-16T14:00:00.000Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scheduledAt` | string | Yes | New ISO date-time |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Appointment rescheduled successfully",
  "data": {
    "id": "uuid",
    "patientId": "uuid",
    "doctorId": "uuid",
    "scheduledAt": "2025-06-16T14:00:00.000Z",
    "status": "BOOKED",
    "createdAt": "2025-06-01T00:00:00.000Z",
    "doctor": {
      "id": "uuid",
      "name": "Dr. Smith",
      "specialty": "Cardiology"
    }
  }
}
```

**Error Responses**
- `404 Not Found` — `"Appointment not found"`
- `403 Forbidden` — `"You can only reschedule your own appointments"`
- `409 Conflict` — `"New time slot already booked"`

---

#### `DELETE /api/patients/me/appointments/:id`

Cancel the patient's own appointment.

**Auth:** `auth` + `requireRole("PATIENT")`

**URL Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | UUID of the appointment |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Appointment cancelled successfully",
  "data": {
    "id": "uuid",
    "patientId": "uuid",
    "doctorId": "uuid",
    "scheduledAt": "2025-06-15T10:00:00.000Z",
    "status": "CANCELLED",
    "createdAt": "2025-06-01T00:00:00.000Z",
    "doctor": {
      "id": "uuid",
      "name": "Dr. Smith",
      "specialty": "Cardiology"
    }
  }
}
```

**Error Responses**
- `404 Not Found` — `"Appointment not found"`
- `403 Forbidden` — `"You can only cancel your own appointments"`
- `400 Bad Request` — `"Cannot cancel a completed or already cancelled appointment"`

---

#### `GET /api/patients/search`

Search patients by name, diagnosed condition, or medication.

**Auth:** `auth` + `requireRole("DOCTOR", "RECEPTIONIST")`

**Query Parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Patient name (case-insensitive contains) |
| `condition` | string | No | Diagnosed condition |
| `medication` | string | No | Prescribed drug name |

**Note:** For DOCTOR role, search is scoped to their assigned patients only.

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Patients found successfully",
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "gender": "male",
      "dateOfBirth": "1990-01-15T00:00:00.000Z",
      "phone": "+1234567890"
    }
  ]
}
```

---

#### `GET /api/patients`

List all patients (paginated).

**Auth:** `auth` + `requireRole("RECEPTIONIST", "ADMIN")`

**Query Parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `search` | string | No | Search by name |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 10) |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Patients retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "gender": "male",
      "dateOfBirth": "1990-01-15T00:00:00.000Z",
      "phone": "+1234567890"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

---

#### `GET /api/patients/:id`

Get a patient profile by ID.

**Auth:** `auth` + `requireRole("PATIENT", "DOCTOR", "RECEPTIONIST", "ADMIN")`

**URL Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | UUID of the patient |

**Notes:**
- PATIENT role can only view their own profile
- DOCTOR role can only view patients they have appointments with

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Patient retrieved successfully",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "gender": "male",
    "dateOfBirth": "1990-01-15T00:00:00.000Z",
    "phone": "+1234567890",
    "appointments": [
      {
        "id": "uuid",
        "scheduledAt": "2025-06-15T10:00:00.000Z",
        "status": "BOOKED",
        "doctor": {
          "id": "uuid",
          "name": "Dr. Smith",
          "specialty": "Cardiology"
        }
      }
    ]
  }
}
```

---

#### `PATCH /api/patients/:id`

Update a patient profile.

**Auth:** `auth` + `requireRole("PATIENT", "ADMIN")`

**URL Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | UUID of the patient |

**Request Body** (all fields optional)
```json
{
  "phone": "+1987654321",
  "name": "Updated Name",
  "gender": "male",
  "dateOfBirth": "1990-06-15"
}
```

**Note:** PATIENT role can only update their own profile and only the `phone` field. ADMIN role can update all fields.

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Patient updated successfully",
  "data": {
    "id": "uuid",
    "name": "Updated Name",
    "email": "john@example.com",
    "gender": "male",
    "dateOfBirth": "1990-06-15T00:00:00.000Z",
    "phone": "+1987654321"
  }
}
```

---

### 5. Doctor Module — `/api/doctors`

---

#### `GET /api/doctors`

List all doctors with optional filters and pagination.

**Auth:** `auth` + `requireRole("PATIENT", "DOCTOR", "RECEPTIONIST", "ADMIN")`

**Query Parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `search` | string | No | Search by name or specialty |
| `specialty` | string | No | Filter by specialty |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 10) |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Doctors retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Dr. Smith",
      "email": "drsmith@example.com",
      "gender": "male",
      "specialty": "Cardiology"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

---

#### `GET /api/doctors/me`

Get the authenticated doctor's own profile.

**Auth:** `auth` + `requireRole("DOCTOR")`

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "name": "Dr. Smith",
    "email": "drsmith@example.com",
    "gender": "male",
    "specialty": "Cardiology",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

#### `PUT /api/doctors/me`

Update the authenticated doctor's own profile.

**Auth:** `auth` + `requireRole("DOCTOR")`

**Request Body** (all fields optional)
```json
{
  "name": "Dr. Smith Updated",
  "gender": "male",
  "specialty": "Neurology"
}
```

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "name": "Dr. Smith Updated",
    "email": "drsmith@example.com",
    "gender": "male",
    "specialty": "Neurology",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

#### `GET /api/doctors/me/schedule`

View the doctor's daily/weekly schedule (7-day window).

**Auth:** `auth` + `requireRole("DOCTOR")`

**Query Parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | No | Reference date (defaults to today). ISO date string. |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Schedule retrieved successfully",
  "data": {
    "weekStart": "2025-06-15T00:00:00.000Z",
    "weekEnd": "2025-06-21T23:59:59.999Z",
    "appointments": [
      {
        "id": "uuid",
        "patientId": "uuid",
        "doctorId": "uuid",
        "scheduledAt": "2025-06-15T10:00:00.000Z",
        "status": "BOOKED",
        "createdAt": "2025-06-01T00:00:00.000Z",
        "patient": {
          "id": "uuid",
          "name": "John Doe"
        }
      }
    ]
  }
}
```

---

#### `GET /api/doctors/me/appointments`

List the doctor's upcoming appointments (BOOKED or CHECKED_IN).

**Auth:** `auth` + `requireRole("DOCTOR")`

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Appointments retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "patientId": "uuid",
      "doctorId": "uuid",
      "scheduledAt": "2025-06-15T10:00:00.000Z",
      "status": "BOOKED",
      "createdAt": "2025-06-01T00:00:00.000Z",
      "patient": {
        "id": "uuid",
        "name": "John Doe"
      }
    }
  ]
}
```

---

#### `GET /api/doctors/:id`

View a doctor's profile by ID.

**Auth:** `auth` + `requireRole("PATIENT", "RECEPTIONIST", "DOCTOR", "ADMIN")`

**URL Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | UUID of the doctor |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Doctor retrieved successfully",
  "data": {
    "id": "uuid",
    "name": "Dr. Smith",
    "email": "drsmith@example.com",
    "gender": "male",
    "specialty": "Cardiology",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### 6. Appointment Module — `/api/appointments`

---

#### `GET /api/appointments`

List appointments with filters and pagination.

**Auth:** `auth` + `requireRole("DOCTOR", "RECEPTIONIST", "ADMIN")`

**Query Parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | No | Filter by date (ISO date string) |
| `doctorId` | string | No | Filter by doctor UUID |
| `status` | string | No | Filter by status (`BOOKED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`) |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 10) |

**Note:** DOCTOR role is auto-scoped to only their own appointments.

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Appointments retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "patientId": "uuid",
      "doctorId": "uuid",
      "scheduledAt": "2025-06-15T10:00:00.000Z",
      "status": "BOOKED",
      "createdAt": "2025-06-01T00:00:00.000Z",
      "patient": {
        "id": "uuid",
        "name": "John Doe"
      },
      "doctor": {
        "id": "uuid",
        "name": "Dr. Smith",
        "specialty": "Cardiology"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

---

#### `POST /api/appointments`

Create a new appointment (with conflict check).

**Auth:** `auth` + `requireRole("PATIENT", "RECEPTIONIST")`

**Request Body**
```json
{
  "patientId": "uuid",
  "doctorId": "uuid",
  "scheduledAt": "2025-06-15T10:00:00.000Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `patientId` | string | Yes | UUID of the patient |
| `doctorId` | string | Yes | UUID of the doctor |
| `scheduledAt` | string | Yes | ISO date-time string |

**Success Response** `201 Created`
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Appointment booked successfully",
  "data": {
    "id": "uuid",
    "patientId": "uuid",
    "doctorId": "uuid",
    "scheduledAt": "2025-06-15T10:00:00.000Z",
    "status": "BOOKED",
    "createdAt": "2025-06-01T00:00:00.000Z",
    "patient": {
      "id": "uuid",
      "name": "John Doe"
    },
    "doctor": {
      "id": "uuid",
      "name": "Dr. Smith",
      "specialty": "Cardiology"
    }
  }
}
```

**Error Responses**
- `409 Conflict` — `"Time slot already booked"`

---

#### `PATCH /api/appointments/:id`

Update/reschedule an appointment.

**Auth:** `auth` + `requireRole("PATIENT", "RECEPTIONIST")`

**URL Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | UUID of the appointment |

**Request Body** (all fields optional)
```json
{
  "scheduledAt": "2025-06-16T14:00:00.000Z",
  "status": "BOOKED"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scheduledAt` | string | No | New ISO date-time |
| `status` | string | No | New status (`BOOKED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`) |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Appointment updated successfully",
  "data": {
    "id": "uuid",
    "patientId": "uuid",
    "doctorId": "uuid",
    "scheduledAt": "2025-06-16T14:00:00.000Z",
    "status": "BOOKED",
    "createdAt": "2025-06-01T00:00:00.000Z",
    "patient": {
      "id": "uuid",
      "name": "John Doe"
    },
    "doctor": {
      "id": "uuid",
      "name": "Dr. Smith",
      "specialty": "Cardiology"
    }
  }
}
```

**Error Responses**
- `404 Not Found` — `"Appointment not found"`
- `403 Forbidden` — Patient trying to update another's appointment
- `400 Bad Request` — `"Cannot reschedule a completed appointment"`
- `409 Conflict` — `"New time slot already booked"`

---

#### `POST /api/appointments/override`

Force-book an appointment even if there is a time conflict (requires reason).

**Auth:** `auth` + `requireRole("RECEPTIONIST")`

**Request Body**
```json
{
  "patientId": "uuid",
  "doctorId": "uuid",
  "scheduledAt": "2025-06-15T10:00:00.000Z",
  "reason": "Emergency override"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `patientId` | string | Yes | UUID of the patient |
| `doctorId` | string | Yes | UUID of the doctor |
| `scheduledAt` | string | Yes | ISO date-time string |
| `reason` | string | Yes | Reason for overriding the conflict |

**Success Response** `201 Created`
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Appointment overridden successfully",
  "data": { "...appointment with patient and doctor info..." }
}
```

---

#### `DELETE /api/appointments/:id`

Cancel an appointment.

**Auth:** `auth` + `requireRole("PATIENT", "RECEPTIONIST")`

**URL Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | UUID of the appointment |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Appointment cancelled successfully",
  "data": { "...appointment with status CANCELLED..." }
}
```

**Error Responses**
- `404 Not Found` — `"Appointment not found"`
- `403 Forbidden` — Patient trying to cancel another's appointment
- `400 Bad Request` — `"Cannot cancel a completed or already cancelled appointment"`

---

#### `POST /api/appointments/:id/check-in`

Check a patient in (BOOKED → CHECKED_IN).

**Auth:** `auth` + `requireRole("RECEPTIONIST")`

**URL Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | UUID of the appointment |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Patient checked in successfully",
  "data": { "...appointment with status CHECKED_IN..." }
}
```

**Error Responses**
- `404 Not Found` — `"Appointment not found"`
- `400 Bad Request` — `"Only booked appointments can be checked in"`

---

#### `POST /api/appointments/:id/check-out`

Check a patient out (CHECKED_IN → COMPLETED).

**Auth:** `auth` + `requireRole("RECEPTIONIST")`

**URL Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | UUID of the appointment |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Patient checked out successfully",
  "data": { "...appointment with status COMPLETED..." }
}
```

**Error Responses**
- `404 Not Found` — `"Appointment not found"`
- `400 Bad Request` — `"Only checked-in appointments can be checked out"`

---

### 7. Medical Records Module — `/api/medical-records`

---

#### `GET /api/medical-records/me`

View the authenticated patient's own medical history.

**Auth:** `auth` + `requireRole("PATIENT")`

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Medical history retrieved successfully",
  "data": {
    "appointments": [
      {
        "id": "uuid",
        "patientId": "uuid",
        "doctorId": "uuid",
        "scheduledAt": "2025-06-15T10:00:00.000Z",
        "status": "COMPLETED",
        "doctor": {
          "id": "uuid",
          "name": "Dr. Smith",
          "specialty": "Cardiology"
        }
      }
    ],
    "medicalRecords": [
      {
        "id": "uuid",
        "patientId": "uuid",
        "doctorId": "uuid",
        "notes": "Patient reports chest pain...",
        "createdAt": "2025-06-15T10:30:00.000Z",
        "doctor": {
          "id": "uuid",
          "name": "Dr. Smith"
        },
        "diagnoses": [
          {
            "id": "uuid",
            "recordId": "uuid",
            "condition": "Hypertension",
            "notes": "Stage 1"
          }
        ]
      }
    ],
    "prescriptions": [
      {
        "id": "uuid",
        "patientId": "uuid",
        "doctorId": "uuid",
        "diagnosisId": "uuid",
        "drug": "Lisinopril",
        "dosage": "10mg",
        "frequency": "Once daily",
        "duration": "30 days",
        "createdAt": "2025-06-15T10:30:00.000Z",
        "doctor": {
          "id": "uuid",
          "name": "Dr. Smith"
        },
        "diagnosis": {
          "condition": "Hypertension"
        }
      }
    ]
  }
}
```

---

#### `GET /api/medical-records/patient/:patientId`

View an assigned patient's full medical history (Doctor only).

**Auth:** `auth` + `requireRole("DOCTOR")`

**URL Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `patientId` | string | UUID of the patient |

**Notes:** Doctor is scoped to only patients they have appointments with.

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Patient history retrieved successfully",
  "data": { "...same structure as /me..." }
}
```

**Error Responses**
- `403 Forbidden` — `"You can only view your assigned patients"`

---

#### `POST /api/medical-records/patient/:patientId`

Create a new medical record (visit notes) for a patient.

**Auth:** `auth` + `requireRole("DOCTOR")`

**URL Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `patientId` | string | UUID of the patient |

**Request Body**
```json
{
  "notes": "Patient reports persistent cough and shortness of breath"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `notes` | string | Yes | Clinical notes from the visit |

**Success Response** `201 Created`
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Medical record created successfully",
  "data": {
    "id": "uuid",
    "patientId": "uuid",
    "doctorId": "uuid",
    "notes": "Patient reports persistent cough and shortness of breath",
    "createdAt": "2025-06-15T10:30:00.000Z"
  }
}
```

---

#### `POST /api/medical-records/:recordId/diagnoses`

Add a diagnosis to an existing medical record.

**Auth:** `auth` + `requireRole("DOCTOR")`

**URL Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `recordId` | string | UUID of the medical record |

**Request Body**
```json
{
  "condition": "Hypertension",
  "notes": "Stage 1 hypertension, monitor regularly"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `condition` | string | Yes | Diagnosed condition name |
| `notes` | string | No | Additional notes |

**Success Response** `201 Created`
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Diagnosis added successfully",
  "data": {
    "id": "uuid",
    "recordId": "uuid",
    "condition": "Hypertension",
    "notes": "Stage 1 hypertension, monitor regularly"
  }
}
```

**Error Responses**
- `404 Not Found` — `"Medical record not found"`
- `403 Forbidden` — `"You can only add diagnoses to your own records"`

---

### 8. Prescription Module — `/api/prescriptions`

---

#### `GET /api/prescriptions/me`

View the authenticated patient's own prescriptions.

**Auth:** `auth` + `requireRole("PATIENT")`

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Prescriptions retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "patientId": "uuid",
      "doctorId": "uuid",
      "diagnosisId": "uuid",
      "drug": "Lisinopril",
      "dosage": "10mg",
      "frequency": "Once daily",
      "duration": "30 days",
      "createdAt": "2025-06-15T10:30:00.000Z",
      "doctor": {
        "id": "uuid",
        "name": "Dr. Smith",
        "specialty": "Cardiology"
      },
      "diagnosis": {
        "condition": "Hypertension"
      }
    }
  ]
}
```

---

#### `POST /api/prescriptions`

Create a new e-prescription (Doctor only).

**Auth:** `auth` + `requireRole("DOCTOR")`

**Request Body**
```json
{
  "patientId": "uuid",
  "diagnosisId": "uuid",
  "drug": "Lisinopril",
  "dosage": "10mg",
  "frequency": "Once daily",
  "duration": "30 days"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `patientId` | string | Yes | UUID of the patient |
| `diagnosisId` | string | No | UUID of the related diagnosis |
| `drug` | string | Yes | Medication name |
| `dosage` | string | Yes | Dosage instruction |
| `frequency` | string | Yes | Frequency (e.g., "Once daily") |
| `duration` | string | Yes | Duration (e.g., "30 days") |

**Success Response** `201 Created`
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Prescription created successfully",
  "data": {
    "id": "uuid",
    "patientId": "uuid",
    "doctorId": "uuid",
    "diagnosisId": "uuid",
    "drug": "Lisinopril",
    "dosage": "10mg",
    "frequency": "Once daily",
    "duration": "30 days",
    "createdAt": "2025-06-15T10:30:00.000Z",
    "patient": {
      "id": "uuid",
      "name": "John Doe"
    },
    "doctor": {
      "id": "uuid",
      "name": "Dr. Smith"
    },
    "diagnosis": {
      "condition": "Hypertension"
    }
  }
}
```

---

#### `POST /api/prescriptions/me/:id/refill`

Request a prescription refill as a patient.

**Auth:** `auth` + `requireRole("PATIENT")`

**URL Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | UUID of the prescription |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Refill requested successfully",
  "data": {
    "message": "Refill request submitted successfully",
    "prescriptionId": "uuid",
    "drug": "Lisinopril",
    "requestedAt": "2025-06-16T12:00:00.000Z"
  }
}
```

**Error Responses**
- `404 Not Found` — `"Prescription not found"`
- `403 Forbidden` — `"You can only request refills for your own prescriptions"`

---

### 9. Insurance Module — `/api/insurance`

---

#### `GET /api/insurance`

List all insurance claims (Receptionist only).

**Auth:** `auth` + `requireRole("RECEPTIONIST")`

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Claims retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "patientId": "uuid",
      "appointmentId": "uuid",
      "status": "SUBMITTED",
      "createdAt": "2025-06-15T10:30:00.000Z",
      "patient": {
        "id": "uuid",
        "name": "John Doe"
      },
      "appointment": {
        "id": "uuid",
        "scheduledAt": "2025-06-15T10:00:00.000Z"
      }
    }
  ]
}
```

---

#### `POST /api/insurance`

Submit a new insurance claim (Receptionist only).

**Auth:** `auth` + `requireRole("RECEPTIONIST")`

**Request Body**
```json
{
  "patientId": "uuid",
  "appointmentId": "uuid"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `patientId` | string | Yes | UUID of the patient |
| `appointmentId` | string | Yes | UUID of the appointment (must be unique per claim) |

**Success Response** `201 Created`
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Insurance claim submitted successfully",
  "data": {
    "id": "uuid",
    "patientId": "uuid",
    "appointmentId": "uuid",
    "status": "SUBMITTED",
    "createdAt": "2025-06-15T10:30:00.000Z",
    "patient": {
      "id": "uuid",
      "name": "John Doe"
    },
    "appointment": {
      "id": "uuid",
      "scheduledAt": "2025-06-15T10:00:00.000Z"
    }
  }
}
```

**Error Responses**
- `404 Not Found` — `"Appointment not found"`
- `409 Conflict` — `"A claim for this appointment already exists"`

---

#### `PUT /api/insurance/:id`

Update claim status (Receptionist only).

**Auth:** `auth` + `requireRole("RECEPTIONIST")`

**URL Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | UUID of the claim |

**Request Body**
```json
{
  "status": "IN_REVIEW"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | One of `SUBMITTED`, `IN_REVIEW`, `APPROVED`, `REJECTED` |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Claim status updated successfully",
  "data": { "...claim with updated status..." }
}
```

**Error Responses**
- `404 Not Found` — `"Claim not found"`

---

#### `GET /api/insurance/me`

View own insurance claims (Patient only).

**Auth:** `auth` + `requireRole("PATIENT")`

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Claims retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "patientId": "uuid",
      "appointmentId": "uuid",
      "status": "SUBMITTED",
      "createdAt": "2025-06-15T10:30:00.000Z",
      "appointment": {
        "id": "uuid",
        "scheduledAt": "2025-06-15T10:00:00.000Z"
      }
    }
  ]
}
```

---

### 10. Receptionist Module — `/api/receptionist`

---

#### `GET /api/receptionist/appointments`

View clinic-wide appointment calendar with filters.

**Auth:** `auth` + `requireRole("RECEPTIONIST")`

**Query Parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | No | Filter by date |
| `doctorId` | string | No | Filter by doctor |
| `status` | string | No | Filter by status |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 50) |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Appointments retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "patientId": "uuid",
      "doctorId": "uuid",
      "scheduledAt": "2025-06-15T10:00:00.000Z",
      "status": "BOOKED",
      "createdAt": "2025-06-01T00:00:00.000Z",
      "patient": {
        "id": "uuid",
        "name": "John Doe",
        "phone": "+1234567890"
      },
      "doctor": {
        "id": "uuid",
        "name": "Dr. Smith",
        "specialty": "Cardiology"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1
  }
}
```

---

#### `PUT /api/receptionist/appointments/:id`

Edit/override an appointment's time or status.

**Auth:** `auth` + `requireRole("RECEPTIONIST")`

**URL Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | UUID of the appointment |

**Request Body** (all fields optional)
```json
{
  "scheduledAt": "2025-06-16T14:00:00.000Z",
  "status": "BOOKED"
}
```

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Appointment updated successfully",
  "data": {
    "...appointment with patient (name, phone) and doctor (name, specialty)..."
  }
}
```

---

#### `PUT /api/receptionist/appointments/:id/check-in`

Check a patient in (BOOKED → CHECKED_IN).

**Auth:** `auth` + `requireRole("RECEPTIONIST")`

**URL Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | UUID of the appointment |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Patient checked in successfully",
  "data": { "...appointment with status CHECKED_IN..." }
}
```

**Error Responses**
- `404 Not Found` — `"Appointment not found"`
- `400 Bad Request` — `"Only booked appointments can be checked in"`

---

#### `PUT /api/receptionist/appointments/:id/check-out`

Check a patient out (CHECKED_IN → COMPLETED).

**Auth:** `auth` + `requireRole("RECEPTIONIST")`

**URL Parameters**

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | UUID of the appointment |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Patient checked out successfully",
  "data": { "...appointment with status COMPLETED..." }
}
```

**Error Responses**
- `404 Not Found` — `"Appointment not found"`
- `400 Bad Request` — `"Only checked-in appointments can be checked out"`

---

### 11. Search Module — `/api/search`

---

#### `GET /api/search/patients?query=`

Cross-cutting patient search by name, condition, or medication.

**Auth:** `auth` + `requireRole("DOCTOR", "RECEPTIONIST")`

**Query Parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Search term (searches name, diagnosis condition, and medication drug) |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Patients found successfully",
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "gender": "male",
      "phone": "+1234567890"
    }
  ]
}
```

---

#### `GET /api/search/appointments?date=&doctorId=&status=`

Filter appointments by date, doctor, or status.

**Auth:** `auth` + `requireRole("DOCTOR", "RECEPTIONIST")`

**Query Parameters**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | No | ISO date string |
| `doctorId` | string | No | UUID of the doctor |
| `status` | string | No | Appointment status |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Appointments found successfully",
  "data": [
    {
      "id": "uuid",
      "patientId": "uuid",
      "doctorId": "uuid",
      "scheduledAt": "2025-06-15T10:00:00.000Z",
      "status": "BOOKED",
      "createdAt": "2025-06-01T00:00:00.000Z",
      "patient": {
        "id": "uuid",
        "name": "John Doe",
        "phone": "+1234567890"
      },
      "doctor": {
        "id": "uuid",
        "name": "Dr. Smith",
        "specialty": "Cardiology"
      }
    }
  ]
}
```

---

### 12. AI Module — `/api/ai` ⚠️ (Not Mounted)

> **Note:** This route file (`src/modules/ai/ai.routes.ts`) exists but is **not imported** in `src/routes/index.ts`. The endpoint below is defined but currently unreachable.

#### `POST /api/ai/symptom-check`

Submit symptoms and get suggested specialty and urgency level.

**Auth:** `auth` + `requireRole("PATIENT")`

**Request Body**
```json
{
  "symptoms": "I have chest pain and shortness of breath"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `symptoms` | string | Yes | Free-text symptom description |

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Symptom analysis complete",
  "data": {
    "suggestedSpecialty": "Cardiology",
    "urgency": "high"
  }
}
```

**Error Responses**
- `400 Bad Request` — `"Symptoms description is required"`

---

### 13. Notification Module — `/api/notifications`

---

#### `GET /api/notifications/me`

List own reminders (role-aware: different data for PATIENT, DOCTOR, RECEPTIONIST).

**Auth:** `auth` (any authenticated user)

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notifications retrieved successfully",
  "data": [
    {
      "type": "APPOINTMENT_REMINDER",
      "message": "Upcoming appointment with Dr. Smith (Cardiology) on 6/15/2025, 10:00:00 AM",
      "scheduledAt": "2025-06-15T10:00:00.000Z",
      "relatedId": "uuid"
    }
  ]
}
```

**Role-specific behavior:**
- **PATIENT:** Upcoming appointments in the next 48 hours
- **DOCTOR:** Upcoming appointments in the next 24 hours
- **RECEPTIONIST:** Today's schedule summary + individual appointments

---

#### `POST /api/notifications/trigger`

Manually trigger a reminder run (scans next 24h appointments).

**Auth:** `auth` + `requireRole("ADMIN")`

**Success Response** `200 OK`
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Reminder run triggered successfully",
  "data": {
    "triggeredAt": "2025-06-15T12:00:00.000Z",
    "remindersGenerated": 5,
    "details": [
      {
        "appointmentId": "uuid",
        "patientName": "John Doe",
        "doctorName": "Dr. Smith",
        "scheduledAt": "2025-06-16T10:00:00.000Z"
      }
    ]
  }
}
```

---

## Data Models (Prisma)

### Patient
| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | Auto-generated |
| name | String | |
| email | String | Unique |
| password | String | bcrypt-hashed |
| gender | String | |
| dateOfBirth | DateTime | |
| phone | String? | Optional |
| createdAt | DateTime | Auto |

### Doctor
| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | Auto-generated |
| name | String | |
| email | String | Unique |
| password | String | bcrypt-hashed |
| gender | String | |
| specialty | String | |
| createdAt | DateTime | Auto |

### Appointment
| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | Auto-generated |
| patientId | UUID (FK) | → Patient |
| doctorId | UUID (FK) | → Doctor |
| scheduledAt | DateTime | |
| status | AppointmentStatus | BOOKED / CHECKED_IN / COMPLETED / CANCELLED |
| createdAt | DateTime | Auto |

### MedicalRecord
| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | Auto-generated |
| patientId | UUID (FK) | → Patient |
| doctorId | UUID (FK) | → Doctor |
| notes | String | Clinical notes |
| createdAt | DateTime | Auto |

### Diagnosis
| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | Auto-generated |
| recordId | UUID (FK) | → MedicalRecord |
| condition | String | |
| notes | String? | Optional |

### Prescription
| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | Auto-generated |
| patientId | UUID (FK) | → Patient |
| doctorId | UUID (FK) | → Doctor |
| diagnosisId | UUID (FK)? | → Diagnosis (optional) |
| drug | String | |
| dosage | String | |
| frequency | String | |
| duration | String | |
| createdAt | DateTime | Auto |

### InsuranceClaim
| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | Auto-generated |
| patientId | UUID (FK) | → Patient |
| appointmentId | UUID (FK) | → Appointment (unique) |
| status | InsuranceClaimStatus | SUBMITTED / IN_REVIEW / APPROVED / REJECTED |
| createdAt | DateTime | Auto |

### Admin
| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | Auto-generated |
| name | String | |
| email | String | Unique |
| password | String | bcrypt-hashed |
| createdAt | DateTime | Auto |

### Receptionist
| Field | Type | Notes |
|-------|------|-------|
| id | UUID (PK) | Auto-generated |
| name | String | |
| email | String | Unique |
| password | String | bcrypt-hashed |
| createdAt | DateTime | Auto |
