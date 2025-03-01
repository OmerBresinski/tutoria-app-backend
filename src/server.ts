import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { logger } from "./utils/logger";
import { connectDB } from "./utils/db";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import tutorRoutes from "./routes/tutorRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import chatRoutes from "./routes/chatRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import { errorHandler } from "./utils/errorHandler";
import { scheduleAutomaticLessonCompletion } from "./utils/scheduler"; // Import the scheduler

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/tutors", tutorRoutes);
app.use("/bookings", bookingRoutes);
app.use("/payments", paymentRoutes);
app.use("/reviews", reviewRoutes);
app.use("/chats", chatRoutes);
app.use("/notifications", notificationRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Tutoring App Backend is Running!");
});

// Error Handler
app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
      scheduleAutomaticLessonCompletion(); // Start the scheduler
    });
  })
  .catch((error: Error) => {
    logger.error("Failed to connect to the database:", error);
  });
