import { body } from "express-validator";

export const userValidator = [
  body("firstName").notEmpty().withMessage("First name is required"),
  body("lastName").notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Invalid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("gender").notEmpty().withMessage("Gender is required"),
  body("phoneNumber").notEmpty().withMessage("Phone number is required"),
  body("country").notEmpty().withMessage("Country is required"),
];
