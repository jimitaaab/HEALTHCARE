import { prisma } from "../../config/prisma";

const REMINDER_INTERVAL_MS = 30 * 60 * 1000;

const processReminders = async () => {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: now, lte: in24Hours },
        status: "BOOKED",
      },
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    for (const apt of upcomingAppointments) {
      const hoursUntil = Math.round(
        (apt.scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60),
      );
      console.log(
        `[Scheduler] Reminder: Patient "${apt.patient.name}" has an appointment with Dr. "${apt.doctor.name}" in ${hoursUntil} hour(s)`,
      );
    }

    if (upcomingAppointments.length > 0) {
      console.log(
        `[Scheduler] Processed ${upcomingAppointments.length} appointment reminder(s)`,
      );
    }
  } catch (error) {
    console.error("[Scheduler] Error processing reminders:", error);
  }
};

let intervalHandle: ReturnType<typeof setInterval> | null = null;

const startScheduler = () => {
  if (intervalHandle) return;
  console.log("[Scheduler] Starting reminder scheduler...");
  processReminders();
  intervalHandle = setInterval(processReminders, REMINDER_INTERVAL_MS);
};

const stopScheduler = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log("[Scheduler] Reminder scheduler stopped");
  }
};

export { startScheduler, stopScheduler };
