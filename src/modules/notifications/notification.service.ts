import { prisma } from "../../config/prisma";

const getMyNotifications = async (userId: string, role: string) => {
  const now = new Date();
  const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const reminders: Array<{
    type: string;
    message: string;
    scheduledAt?: Date;
    relatedId?: string;
  }> = [];

  if (role === "PATIENT") {
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        patientId: userId,
        scheduledAt: { gte: now, lte: in48Hours },
        status: { in: ["BOOKED", "CHECKED_IN"] },
      },
      include: { doctor: { select: { name: true, specialty: true } } },
      orderBy: { scheduledAt: "asc" },
    });

    for (const apt of upcomingAppointments) {
      reminders.push({
        type: "APPOINTMENT_REMINDER",
        message: `Upcoming appointment with Dr. ${apt.doctor.name} (${apt.doctor.specialty}) on ${apt.scheduledAt.toLocaleString()}`,
        scheduledAt: apt.scheduledAt,
        relatedId: apt.id,
      });
    }
  }

  if (role === "DOCTOR") {
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: userId,
        scheduledAt: { gte: now, lte: tomorrow },
        status: { in: ["BOOKED", "CHECKED_IN"] },
      },
      include: { patient: { select: { name: true } } },
      orderBy: { scheduledAt: "asc" },
    });

    for (const apt of upcomingAppointments) {
      reminders.push({
        type: "APPOINTMENT_REMINDER",
        message: `Upcoming appointment with patient ${apt.patient.name} at ${apt.scheduledAt.toLocaleString()}`,
        scheduledAt: apt.scheduledAt,
        relatedId: apt.id,
      });
    }
  }

  if (role === "RECEPTIONIST") {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const todayAppointments = await prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: todayStart, lt: todayEnd },
        status: { not: "CANCELLED" },
      },
      include: {
        patient: { select: { name: true } },
        doctor: { select: { name: true, specialty: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });

    reminders.push({
      type: "DAILY_SCHEDULE",
      message: `You have ${todayAppointments.length} appointment(s) scheduled for today`,
    });

    for (const apt of todayAppointments) {
      reminders.push({
        type: "APPOINTMENT_REMINDER",
        message: `${apt.patient.name} with Dr. ${apt.doctor.name} at ${apt.scheduledAt.toLocaleString()}`,
        scheduledAt: apt.scheduledAt,
        relatedId: apt.id,
      });
    }
  }

  return reminders;
};

const triggerReminderRun = async () => {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: now, lte: in24Hours },
      status: "BOOKED",
    },
    include: {
      patient: { select: { id: true, name: true, email: true } },
      doctor: { select: { id: true, name: true } },
    },
  });

  return {
    triggeredAt: now,
    remindersGenerated: upcomingAppointments.length,
    details: upcomingAppointments.map((apt) => ({
      appointmentId: apt.id,
      patientName: apt.patient.name,
      doctorName: apt.doctor.name,
      scheduledAt: apt.scheduledAt,
    })),
  };
};

export const notificationService = {
  getMyNotifications,
  triggerReminderRun,
};
