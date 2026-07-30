import { prisma } from "../../config/prisma";

const searchPatients = async (query: string) => {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = query.trim();

  const [byName, byCondition, byMedication] = await Promise.all([
    prisma.patient.findMany({
      where: { name: { contains: searchTerm, mode: "insensitive" } },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        phone: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.patient.findMany({
      where: {
        records: {
          some: {
            diagnoses: {
              some: {
                condition: { contains: searchTerm, mode: "insensitive" },
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        phone: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.patient.findMany({
      where: {
        prescriptions: {
          some: {
            drug: { contains: searchTerm, mode: "insensitive" },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        phone: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const seen = new Set<string>();
  const merged = [...byName, ...byCondition, ...byMedication].filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  return merged;
};

const searchAppointments = async (filters: {
  date?: string;
  doctorId?: string;
  status?: string;
}) => {
  const where: Record<string, any> = {};

  if (filters.doctorId) where.doctorId = filters.doctorId;
  if (filters.status) where.status = filters.status;
  if (filters.date) {
    const startDate = new Date(filters.date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(filters.date);
    endDate.setHours(23, 59, 59, 999);
    where.scheduledAt = { gte: startDate, lte: endDate };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      doctor: { select: { id: true, name: true, specialty: true } },
    },
  });

  return appointments;
};

export const searchService = {
  searchPatients,
  searchAppointments,
};
