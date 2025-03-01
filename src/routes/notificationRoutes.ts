import express, { Request, Response } from "express";
import { prisma } from "../utils/db";
import { authMiddleware } from "../middlewares/authMiddleware";
import { logger } from "../utils/logger";

const router = express.Router();

// @desc    Get all notifications for a user
// @route   GET /notifications
// @access  Private
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      logger.error(`User ID not found in request`);
      res.status(400).json({ message: "User ID not found" });

      return;
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    logger.info(`Notifications retrieved successfully for user id: ${userId}`);
    res.json(notifications);
    return;
  } catch (error: any) {
    logger.error(`Error getting notifications: ${error.message}`);
    res.status(500).json({ message: "Server error" });
    return;
  }
});

// @desc    Mark a notification as read
// @route   PATCH /notifications/:id/mark-as-read
// @access  Private
router.patch(
  "/:id/mark-as-read",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id, 10);
      const userId = req.user?.id;

      if (isNaN(notificationId)) {
        logger.error(`Invalid notification ID: ${req.params.id}`);
        res.status(400).json({ message: "Invalid notification ID" });

        return;
      }

      if (!userId) {
        logger.error(`User ID not found in request`);
        res.status(400).json({ message: "User ID not found" });

        return;
      }

      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: userId,
        },
        data: {
          read: true,
        },
      });

      if (notification.count === 0) {
        logger.error(
          `Notification not found or does not belong to user with id: ${notificationId}`
        );
        res.status(404).json({
          message: "Notification not found or does not belong to user",
        });

        return;
      }

      logger.info(`Notification marked as read with id: ${notificationId}`);
      res.json({ message: "Notification marked as read" });
    } catch (error: any) {
      logger.error(`Error marking notification as read: ${error.message}`);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
