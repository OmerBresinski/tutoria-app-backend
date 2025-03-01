import express, { Request, Response } from "express";
import { prisma } from "../utils/db";
import { authMiddleware } from "../middlewares/authMiddleware";
import { logger } from "../utils/logger";

const router = express.Router();

// @desc    Create a new booking
// @route   POST /bookings
// @access  Private
router.post(
  "/",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tutorId, subject, date, duration, price } = req.body;

      if (!tutorId || !subject || !date || !duration || !price) {
        logger.error(`Missing required fields for booking creation`);
        res.status(400).json({ message: "Missing required fields" });
        return;
      }

      const studentId = req.user?.id;

      if (!studentId) {
        logger.error(`Student ID not found in request`);
        res.status(400).json({ message: "Student ID not found" });
        return;
      }

      // Create booking logic here

      res.status(201).json({ message: "Booking created successfully" });
    } catch (error) {
      logger.error(`Error creating booking: ${(error as Error).message}`);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @desc    Update booking status (confirm/reject)
// @route   PATCH /bookings/:id/status
// @access  Private (Tutor only)
router.patch(
  "/:id/status",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const bookingId = parseInt(req.params.id, 10);
      const { status } = req.body; // Status should be "CONFIRMED" or "REJECTED"

      if (isNaN(bookingId)) {
        logger.error(`Invalid booking ID: ${req.params.id}`);
        res.status(400).json({ message: "Invalid booking ID" });
        return;
      }

      if (!["CONFIRMED", "REJECTED"].includes(status)) {
        logger.error(`Invalid booking status: ${status}`);
        res.status(400).json({ message: "Invalid booking status" });
        return;
      }

      // Update booking status logic here

      res.status(200).json({ message: "Booking status updated successfully" });
    } catch (error) {
      logger.error(
        `Error updating booking status: ${(error as Error).message}`
      );
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @desc    Create a dispute for a booking
// @route   POST /bookings/:id/dispute
// @access  Private (Student only)
router.post(
  "/:id/dispute",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const bookingId = parseInt(req.params.id, 10);
      const userId = req.user?.id;
      const { reason } = req.body;

      if (isNaN(bookingId)) {
        logger.error(`Invalid booking ID: ${req.params.id}`);
        res.status(400).json({ message: "Invalid booking ID" });
        return;
      }

      if (!reason) {
        logger.error(`Reason for dispute is required`);
        res.status(400).json({ message: "Reason for dispute is required" });
        return;
      }

      // Check if the booking exists and belongs to the student
      const booking = await prisma.booking.findUnique({
        where: {
          id: bookingId,
          studentId: userId,
        },
      });

      if (!booking) {
        logger.error(`Booking not found or does not belong to the student`);
        res.status(404).json({
          message: "Booking not found or does not belong to the student",
        });
        return;
      }

      // Create dispute logic here

      res.status(201).json({ message: "Dispute created successfully" });
    } catch (error) {
      logger.error(`Error creating dispute: ${(error as Error).message}`);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @desc    Get all bookings for a user
// @route   GET /bookings
// @access  Private
router.get(
  "/",
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        logger.error(`User ID not found in request`);
        res.status(400).json({ message: "User ID not found" });
        return;
      }

      const bookings = await prisma.booking.findMany({
        where: {
          OR: [
            {
              studentId: userId,
            },
            {
              tutorId: userId,
            },
          ],
        },
        include: {
          student: true,
          tutor: true,
        },
      });

      logger.info(`Bookings retrieved successfully for user id: ${userId}`);
      res.json(bookings);
    } catch (error: any) {
      logger.error(`Error getting bookings: ${error.message}`);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
