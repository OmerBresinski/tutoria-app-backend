import express, { Request, Response } from "express";
import { prisma } from "../utils/db";
import { authMiddleware } from "../middlewares/authMiddleware";
import { logger } from "../utils/logger";

const router = express.Router();

// @desc    Create a new review
// @route   POST /reviews
// @access  Private
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { tutorId, rating, comment, bookingId } = req.body;
    const studentId = req.user?.id;

    if (!tutorId || !rating || !bookingId) {
      logger.error(`Missing required fields for review creation`);
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    if (!studentId) {
      logger.error(`Student ID not found in request`);
      res.status(400).json({ message: "Student ID not found" });
      return;
    }

    // Check if booking exists and belongs to the student
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
        studentId: studentId,
      },
    });

    if (!booking) {
      logger.error(`Booking not found or does not belong to student`);
      res
        .status(404)
        .json({ message: "Booking not found or does not belong to student" });

      return;
    }

    const review = await prisma.review.create({
      data: {
        studentId,
        tutorId,
        rating,
        comment,
      },
    });

    logger.info(`Review created successfully with id: ${review.id}`);
    res.status(201).json(review);
  } catch (error: any) {
    logger.error(`Error creating review: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Get all reviews for a tutor
// @route   GET /reviews/:tutorId
// @access  Public
router.get("/:tutorId", async (req: Request, res: Response) => {
  try {
    const tutorId = parseInt(req.params.tutorId, 10);

    if (isNaN(tutorId)) {
      logger.error(`Invalid tutor ID: ${req.params.tutorId}`);
      res.status(400).json({ message: "Invalid tutor ID" });
      return;
    }

    const reviews = await prisma.review.findMany({
      where: {
        tutorId: tutorId,
      },
      include: {
        student: true,
      },
    });

    logger.info(`Reviews retrieved successfully for tutor id: ${tutorId}`);
    res.json(reviews);
    return;
  } catch (error: any) {
    logger.error(`Error getting reviews: ${error.message}`);
    res.status(500).json({ message: "Server error" });
    return;
  }
});

export default router;
