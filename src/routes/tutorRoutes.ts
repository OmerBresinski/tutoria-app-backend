import { Router, Request, Response } from "express";
import { prisma } from "../utils/db";
import { logger } from "../utils/logger";

const router = Router();

// @desc    Get tutor by ID
// @route   GET /tutors/:id
// @access  Public
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const tutorId = parseInt(req.params.id, 10);

    if (isNaN(tutorId)) {
      logger.error(`Invalid tutor ID: ${req.params.id}`);
      res.status(400).json({ message: "Invalid tutor ID" });
      return;
    }

    const tutor = await prisma.user.findUnique({
      where: {
        id: tutorId,
        role: "TUTOR",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        gender: true,
      },
    });

    if (!tutor) {
      res.status(404).json({ message: "Tutor not found" });
      return;
    }

    res.json(tutor);
  } catch (error) {
    logger.error(`Error fetching tutor by ID: ${(error as Error).message}`);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
