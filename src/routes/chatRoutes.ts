import express, { Request, Response } from "express";
import { prisma } from "../utils/db";
import { authMiddleware } from "../middlewares/authMiddleware";
import { logger } from "../utils/logger";

const router = express.Router();

// @desc    Get all chats for a user
// @route   GET /chats
// @access  Private
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      logger.error(`User ID not found in request`);
      res.status(400).json({ message: "User ID not found" });
      return;
    }

    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          {
            userId: userId,
          },
          {
            partnerOfChatUserId: userId,
          },
        ],
      },
      include: {
        sender: true,
        receiver: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    logger.info(`Chats retrieved successfully for user id: ${userId}`);
    res.json(chats);
  } catch (error: any) {
    logger.error(`Error getting chats: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// @desc    Create a new chat message
// @route   POST /chats
// @access  Private
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { partnerOfChatUserId, message } = req.body;
    const userId = req.user?.id;

    if (!partnerOfChatUserId || !message) {
      logger.error(`Missing required fields for chat creation`);
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    if (!userId) {
      logger.error(`User ID not found in request`);
      res.status(400).json({ message: "User ID not found" });
      return;
    }

    const chat = await prisma.chat.create({
      data: {
        userId,
        partnerOfChatUserId,
        message,
      },
    });

    logger.info(`Chat created successfully with id: ${chat.id}`);
    res.status(201).json(chat);
  } catch (error: any) {
    logger.error(`Error creating chat: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
