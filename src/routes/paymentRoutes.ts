import express, { Request, Response } from "express";
import { prisma } from "../utils/db";
import { authMiddleware } from "../middlewares/authMiddleware";
import { stripe } from "../utils/stripe";
import { logger } from "../utils/logger";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const frontendURL = process.env.FRONTEND_URL;

// @desc    Create a Stripe payment intent
// @route   POST /payments/create-payment-intent
// @access  Private
router.post(
  "/create-payment-intent",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { amount, bookingId } = req.body;
      const userId = req.user?.id;

      if (!amount || !bookingId) {
        logger.error(`Missing amount or bookingId in request body`);
        res.status(400).json({ message: "Missing amount or bookingId" });
        return;
      }

      if (!userId) {
        logger.error(`User ID not found in request`);
        res.status(400).json({ message: "User ID not found" });
        return;
      }

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe uses cents
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          bookingId: bookingId.toString(),
          userId: userId.toString(),
        },
      });

      logger.info(
        `Payment intent created successfully for booking id: ${bookingId}`
      );
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      logger.error(`Error creating payment intent: ${error.message}`);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @desc    Handle Stripe webhook
// @route   POST /payments/webhook
// @access  Public (Stripe requires it to be accessible)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err: any) {
      logger.error(`Webhook signature verification failed: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntentSucceeded = event.data.object as any;
        const bookingId = parseInt(
          paymentIntentSucceeded.metadata.bookingId,
          10
        );
        const userId = parseInt(paymentIntentSucceeded.metadata.userId, 10);

        try {
          // Update booking and payment status in your database
          const booking = await prisma.booking.update({
            where: {
              id: bookingId,
            },
            data: {
              status: "CONFIRMED",
            },
          });

          const payment = await prisma.payment.create({
            data: {
              bookingId: booking.id,
              method: "STRIPE",
              status: "COMPLETED",
              amount: paymentIntentSucceeded.amount / 100, // Convert back to dollars
              userId: userId,
            },
          });

          logger.info(
            `Payment succeeded for booking id: ${bookingId} and payment id: ${payment.id}`
          );
        } catch (error: any) {
          logger.error(`Error updating booking/payment: ${error.message}`);
          res.status(500).json({ message: "Server error" });
          return;
        }
        break;
      default:
        logger.warn(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
    return;
  }
);

// @desc    Create a Stripe Payout to the tutor
// @route   POST /payments/payout/:bookingId
// @access  Private (Admin or System Role)
router.post(
  "/payout/:bookingId",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.bookingId, 10);

      if (isNaN(bookingId)) {
        logger.error(`Invalid booking ID: ${req.params.bookingId}`);
        res.status(400).json({ message: "Invalid booking ID" });
        return;
      }

      // Check if the booking exists and is completed
      const booking = await prisma.booking.findUnique({
        where: {
          id: bookingId,
          status: "COMPLETED",
        },
      });

      if (!booking) {
        logger.error(
          `Booking not found or is not completed with id: ${bookingId}`
        );
        res
          .status(404)
          .json({ message: "Booking not found or is not completed" });
        return;
      }

      // Get the tutor's Stripe Connect account ID from the User model
      const tutor = await prisma.user.findUnique({
        where: {
          id: booking.tutorId,
        },
      });

      if (!tutor?.stripeConnectAccountId) {
        logger.error(
          `Tutor does not have a Stripe Connect account ID for tutor id: ${booking.tutorId}`
        );
        res.status(400).json({
          message: "Tutor does not have a Stripe Connect account ID",
        });
        return;
      }

      // Calculate the payout amount (minus platform fee)
      const payoutAmount = booking.price * 0.9; // Example: 10% platform fee

      // Create a Stripe Transfer to the tutor's Connect account
      const transfer = await stripe.transfers.create({
        amount: Math.round(payoutAmount * 100), // Stripe uses cents
        currency: "usd",
        destination: tutor.stripeConnectAccountId,
      });

      logger.info(
        `Stripe transfer created successfully for booking id: ${bookingId} to tutor id: ${booking.tutorId}`
      );

      res.json({ message: "Payout initiated successfully", transfer });
      return;
    } catch (error: any) {
      logger.error(`Error creating Stripe payout: ${error.message}`);
      res.status(500).json({ message: "Server error" });
      return;
    }
  }
);

export default router;
