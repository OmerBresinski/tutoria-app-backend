import { prisma } from "./db";
import { logger } from "./logger";
import { NotificationType } from "@prisma/client";

// Function to schedule automatic lesson completion
export const scheduleAutomaticLessonCompletion = () => {
  // Run every 5 minutes (adjust as needed)
  setInterval(async () => {
    try {
      logger.info("Running automatic lesson completion check...");

      // Calculate the time 5 minutes after the scheduled end time
      const completionTime = new Date(Date.now() - 5 * 60 * 1000);

      // Find bookings that are confirmed, not yet completed, and whose end time is in the past
      const bookingsToComplete = await prisma.booking.findMany({
        where: {
          status: "CONFIRMED",
          date: {
            lte: completionTime,
          },
          dispute: null, // Only complete if there's no dispute
        },
      });

      logger.info(`Found ${bookingsToComplete.length} bookings to complete.`);

      // Update the status of each booking to COMPLETED
      for (const booking of bookingsToComplete) {
        await prisma.booking.update({
          where: {
            id: booking.id,
          },
          data: {
            status: "COMPLETED",
          },
        });

        logger.info(`Booking automatically completed with id: ${booking.id}`);

        // Notify the tutor that the lesson is completed
        await prisma.notification.create({
          data: {
            userId: booking.tutorId,
            message: `The lesson for ${booking.subject} has been automatically marked as completed.`,
            type: NotificationType.LESSON_REMINDER, // Or a new type like LESSON_COMPLETED
          },
        });
      }
    } catch (error: any) {
      logger.error(
        `Error running automatic lesson completion: ${error.message}`
      );
    }
  }, 5 * 60 * 1000); // Run every 5 minutes
};
