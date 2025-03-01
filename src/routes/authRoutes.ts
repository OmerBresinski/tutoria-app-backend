import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/db";
import { userValidator } from "../validators/userValidator";
import { validationResult } from "express-validator";
import dotenv from "dotenv";
import { logger } from "../utils/logger";

dotenv.config();

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET;
const saltRounds = 10;

if (!jwtSecret) {
  throw new Error("JWT_SECRET is not defined in the environment variables.");
}

// @desc    Register a new user
// @route   POST /auth/register
// @access  Public
router.post(
  "/register",
  userValidator,
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error(`Validation errors: ${JSON.stringify(errors.array())}`);
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const {
      firstName,
      lastName,
      email,
      password,
      gender,
      phoneNumber,
      country,
    } = req.body;

    try {
      // Check if user exists
      let user = await prisma.user.findUnique({ where: { email } });

      if (user) {
        logger.error(`User already exists with email: ${email}`);
        res.status(400).json({ message: "User already exists" });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          gender,
          phoneNumber,
          country,
        },
      });

      logger.info(`User created successfully with email: ${email}`);

      res.status(201).json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        country: user.country,
      });
    } catch (error: any) {
      logger.error(`Error registering user: ${error.message}`);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @desc    Login user
// @route   POST /auth/login
// @access  Public
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      logger.error(`Invalid credentials for email: ${email}`);
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      logger.error(`Invalid credentials for email: ${email}`);
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    // Create JWT Payload
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    // Sign token
    jwt.sign(payload, jwtSecret, { expiresIn: "7d" }, (err, token) => {
      if (err) {
        logger.error(`Error signing token: ${err.message}`);
        throw err;
      }
      logger.info(`User logged in successfully with email: ${email}`);
      res.json({ token });
    });
  } catch (error: any) {
    logger.error(`Error logging in user: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
