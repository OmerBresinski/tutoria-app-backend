import express, { Request, Response } from "express";
import { prisma } from "../utils/db";
import { authMiddleware } from "../middlewares/authMiddleware";
import { logger } from "../utils/logger";

const router = express.Router();

// @desc    Get user profile
// @route   GET /users/me
// @access  Private
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user?.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        gender: true,
        phoneNumber: true,
        country: true,
        role: true,
      },
    });

    if (!user) {
      logger.error(`User not found with id: ${req.user?.id}`);
      res.status(404).json({ message: "User not found" });
      return;
    }

    logger.info(`User profile retrieved successfully for id: ${req.user?.id}`);
    res.json(user);
  } catch (error: any) {
    logger.error(`Error getting user profile: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
