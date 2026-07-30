# HealthCare Backend

A backend API for a healthcare management system built with Express.js, TypeScript, Prisma, and PostgreSQL.

## Features

- Authentication & Authorization (JWT)
- Doctor & Patient management
- Appointment scheduling
- Medical records & Prescriptions
- Admin & Receptionist dashboards
- AI integration
- Insurance management
- Notifications
- Search functionality

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **ORM:** Prisma (PostgreSQL)
- **Auth:** JSON Web Tokens (JWT), bcryptjs

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .envexample .env

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## Scripts

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Start dev server with hot reload   |
| `npm run build`      | Build for production               |
| `npm start`          | Start production server            |
| `npm test`           | Run tests                          |
| `npm run test:coverage` | Run tests with coverage         |

## Deployment

- **Live API:** https://health-care-zeta-one.vercel.app/
