# Tutoring App Backend

This repository contains the backend code for a tutoring app, built with Node.js, Express, Prisma, PostgreSQL, and Stripe. It provides a REST API for managing users, tutors, bookings, payments, reviews, chats, and notifications.

## Table of Contents

*   [Introduction](#introduction)
*   [Features](#features)
*   [Technical Stack](#technical-stack)
*   [Prerequisites](#prerequisites)
*   [Installation](#installation)
*   [Configuration](#configuration)
*   [Running the Application](#running-the-application)
*   [API Endpoints](#api-endpoints)
*   [Payment Flow](#payment-flow)
*   [Automatic Lesson Completion](#automatic-lesson-completion)
*   [Dispute Handling](#dispute-handling)
*   [Stripe Connect](#stripe-connect)
*   [Database Schema](#database-schema)
*   [Logging](#logging)
*   [Error Handling](#error-handling)
*   [Deployment](#deployment)
*   [Contributing](#contributing)
*   [License](#license)

## Introduction

This backend provides the core functionality for a tutoring app, connecting students with tutors and managing the entire learning process from booking to payment. It's designed to be scalable, secure, and easy to maintain.

## Features

*   **User Authentication:** Secure user registration and login using JWT.
*   **Tutor Discovery:** Browse and filter available tutors.
*   **Booking Management:** Create, confirm, and manage bookings.
*   **Secure Payments:** Integrated with Stripe for secure payment processing.
*   **Review System:** Students can rate and review tutors.
*   **Chat Functionality:** Real-time chat between students and tutors.
*   **Notifications:** In-app notifications for important events.
*   **Automatic Lesson Completion:** Automatically completes lessons after a set time.
*   **Dispute Handling:** Students can raise disputes for problematic lessons.
*   **Stripe Connect Payouts:** Facilitates payouts to tutors via Stripe Connect.

## Technical Stack

*   **Backend:** Node.js, Express
*   **Database:** PostgreSQL
*   **ORM:** Prisma
*   **Payment Processing:** Stripe
*   **Authentication:** JWT (JSON Web Tokens)
*   **Logging:** Winston
*   **Task Scheduling:** `setInterval` (for demonstration purposes, consider BullMQ or similar for production)
*   **Typescript:** Used for type safety and improved code maintainability

## Prerequisites

*   Node.js (v18 or higher)
*   npm (or yarn)
*   PostgreSQL database
*   Stripe account
*   Railway account (for deployment)

## Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

    or

    ```bash
    yarn install
    ```

## Configuration

1.  **Create a `.env` file** in the root directory of the project.

2.  **Add the following environment variables** to the `.env` file:

    ```
    DATABASE_URL="your_railway_postgres_url"
    PORT=3000
    JWT_SECRET="your_jwt_secret"
    STRIPE_SECRET_KEY="your_stripe_secret_key"
    STRIPE_PUBLIC_KEY="your_stripe_public_key"
    STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"
    FRONTEND_URL="http://localhost:5173"
    ```

    *   **`DATABASE_URL`:** The connection string for your PostgreSQL database. If deploying to Railway, this will be automatically provided.
    *   **`PORT`:** The port the server will listen on (default: 3000).
    *   **`JWT_SECRET`:** A secret key used to sign JWTs.  **Important:** Use a strong, randomly generated secret.
    *   **`STRIPE_SECRET_KEY`:** Your Stripe secret key.  Find this in your Stripe dashboard.
    *   **`STRIPE_PUBLIC_KEY`:** Your Stripe public key. Find this in your Stripe dashboard.
    *   **`STRIPE_WEBHOOK_SECRET`:** Your Stripe webhook signing secret.  Find this in your Stripe dashboard after configuring your webhook endpoint.
    *   **`FRONTEND_URL`:** The URL of your frontend application.  Used for CORS configuration.

3.  **Stripe API Keys:**

    *   **Stripe Secret Key:** Used for making secure API calls to Stripe from your backend.
    *   **Stripe Public Key:** Used in your frontend for Stripe Elements or Stripe Checkout.
    *   **Stripe Webhook Secret:** Used to verify that incoming webhook events are actually from Stripe.

4.  **External API Documentation:**

    *   **Stripe API:** [https://stripe.com/docs/api](https://stripe.com/docs/api)
    *   **Prisma:** [https://www.prisma.io/docs/](https://www.prisma.io/docs/)

## Running the Application

1.  **Push the Prisma schema to the database:**

    ```bash
    npx prisma db push
    ```

2.  **Generate the Prisma client:**

    ```bash
    npx prisma generate
    ```

3.  **Start the development server:**

    ```bash
    npm run dev
    ```

    or

    ```bash
    yarn dev
    ```

    The server will start running on the specified port (default: 3000).

## API Endpoints

The API endpoints are organized into several routers:

*   **Auth Router (`/auth`):**
    *   `POST /auth/register`: Register a new user.
    *   `POST /auth/login`: Login an existing user.
*   **User Router (`/users`):**
    *   `GET /users/me`: Get the current user's profile.
*   **Tutor Router (`/tutors`):**
    *   `GET /tutors`: Get a list of all tutors.
    *   `GET /tutors/:id`: Get a specific tutor by ID.
*   **Booking Router (`/bookings`):**
    *   `POST /bookings`: Create a new booking.
    *   `PATCH /bookings/:id/status`: Update a booking's status (confirm/reject).
    *   `POST /bookings/:id/dispute`: Create a dispute for a booking.
    *   `GET /bookings`: Get all bookings for the current user.
*   **Payment Router (`/payments`):**
    *   `POST /payments/create-payment-intent`: Create a Stripe Payment Intent.
    *   `POST /payments/webhook`: Handle Stripe webhook events.
    *   `POST /payments/payout/:bookingId`: Create a Stripe payout to a tutor.
*   **Review Router (`/reviews`):**
    *   `POST /reviews`: Create a new review.
    *   `GET /reviews/:tutorId`: Get all reviews for a specific tutor.
*   **Chat Router (`/chats`):**
    *   `GET /chats`: Get all chat messages for the current user.
    *   `POST /chats`: Create a new chat message.
*   **Notification Router (`/notifications`):**
    *   `GET /notifications`: Get all notifications for the current user.
    *   `PATCH /notifications/:id/mark-as-read`: Mark a notification as read.

## Payment Flow

1.  **Student Creates Booking:** The student initiates a booking request.
2.  **Payment Intent Creation:** The frontend calls the `/payments/create-payment-intent` endpoint, which creates a Stripe Payment Intent.
3.  **Student Pays:** The student enters their payment information on Stripe's secure payment form.
4.  **Payment Confirmation:** Stripe processes the payment. If successful, the `payment_intent.succeeded` webhook is triggered.
5.  **Webhook Handler:** The backend's `/payments/webhook` endpoint receives the `payment_intent.succeeded` event.
6.  **Database Update:** The webhook handler updates the `Booking` status to `CONFIRMED` and creates a `Payment` record in the database.
7.  **Tutor Confirms Booking:** The tutor confirms the booking.
8.  **Lesson Takes Place:**
9.  **Automatic Lesson Completion:** The system automatically completes the lesson 5 minutes after the scheduled end time (unless a dispute has been raised).
10. **Admin/System Triggers Payout:** An admin or the system triggers the payout to the tutor by calling the `/payments/payout/:bookingId` endpoint.
11. **Stripe Transfer:** Stripe transfers the funds from the platform's Stripe account to the tutor's Stripe Connect account.

## Automatic Lesson Completion

To automate the lesson completion process:

1.  The `scheduleAutomaticLessonCompletion` function in `src/utils/scheduler.ts` is called when the server starts.
2.  This function uses `setInterval` to run a task every 5 minutes.
3.  The task finds bookings that are confirmed, not yet completed, and whose end time is in the past (5 minutes or more) and have no disputes.
4.  It updates the status of each booking to `COMPLETED` and notifies the tutor.

**Important:** `setInterval` is used for demonstration purposes. For production environments, consider using a more robust task scheduling system like BullMQ, Agenda, or a cloud-based scheduler.

## Dispute Handling

1.  A student can create a dispute for a booking by calling the `POST /bookings/:id/dispute` endpoint.
2.  This creates a new `Dispute` record in the database, associated with the booking.
3.  The automatic lesson completion process will not complete lessons that have active disputes.
4.  Administrators can then review and resolve disputes manually.

## Stripe Connect

This application uses Stripe Connect to facilitate payouts to tutors.

1.  **Tutor Onboarding:** You'll need to implement a Stripe Connect onboarding flow in your application, allowing tutors to connect their Stripe accounts to your platform.
2.  **Storing Connect Account IDs:** The `stripeConnectAccountId` field in the `User` model is used to store the tutor's Stripe Connect account ID.
3.  **Creating Transfers:** The `POST /payments/payout/:bookingId` endpoint uses the Stripe API to create a Transfer to the tutor's Connect account.

**Important:** You *must* use Stripe Connect to enable payouts to tutors. See the Stripe Connect documentation for more information: [https://stripe.com/docs/connect](https://stripe.com/docs/connect)

## Database Schema

The `prisma/schema.prisma` file defines the database schema using Prisma's schema language. Key models include:

*   **User:** Stores user information (students, tutors, admins).
*   **Availability:** Stores tutor availability information.
*   **Booking:** Stores booking information (student, tutor, subject, date, time, price).
*   **Payment:** Stores payment information (booking, method, status, amount).
*   **Review:** Stores reviews given by students to tutors.
*   **Dispute:** Stores dispute information (student, tutor, booking, reason, status).
*   **Chat:** Stores chat messages between users.
*   **Notification:** Stores notifications for users.
*   **MySettings:** Stores user-specific settings.
*   **MyTeacher:** Stores relationships between students and their favorite teachers.
*   **MyLessons:** Stores relationships between students and their lessons.

## Logging

The application uses Winston for logging. Logs are written to the console and to files in the `logs/` directory.

*   `logs/error.log`: Contains error logs.
*   `logs/combined.log`: Contains all logs.

## Error Handling

The application uses a global error handler (`src/utils/errorHandler.ts`) to catch and log errors. In production, the error handler will not expose sensitive information (like stack traces) to the client.

## Deployment

This application is designed to be deployed to Railway.

1.  Create a new project on Railway.
2.  Connect your GitHub repository to the Railway project.
3.  Add a PostgreSQL database service to your Railway project. Railway will automatically provide the `DATABASE_URL` environment variable.
4.  Set the remaining environment variables (`JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLIC_KEY`, `FRONTEND_URL`, `STRIPE_WEBHOOK_SECRET`) in the Railway project settings.
5.  Railway will automatically deploy the application.

## Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with clear, concise messages.
4.  Submit a pull request.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.
