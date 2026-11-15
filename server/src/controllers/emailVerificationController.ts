
import type { Request, Response } from "express";
import {
  requestEmailVerification,
  verifyEmailCode,
} from "../services/emailVerificationService.js";

export async function sendVerification(
  req: Request,
  res: Response
): Promise<void> {
  const { email } = req.body ?? {};

  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    res.status(400).json({
      message: "Please provide a valid email address.",
    });
    return;
  }

  try {
    await requestEmailVerification(email);

    res.status(200).json({
      message:
        "If an unverified account exists, a verification code will be sent.",
    });
  } catch (error) {
    console.error("Failed to send verification email:", error);

    res.status(500).json({
      message: "Unable to send verification code right now.",
    });
  }
}

export async function verifyEmail(
  req: Request,
  res: Response
): Promise<void> {
  const { email, code } = req.body ?? {};

  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    res.status(400).json({
      message: "Please provide a valid email address.",
    });
    return;
  }

  if (
    typeof code !== "string" ||
    !/^\d{6}$/.test(code)
  ) {
    res.status(400).json({
      message: "Verification code must contain exactly 6 digits.",
    });
    return;
  }

  try {
    const success = await verifyEmailCode(email, code);

    if (!success) {
      res.status(400).json({
        message: "Invalid or expired verification code.",
      });
      return;
    }

    res.status(200).json({
      message: "Email verified successfully.",
    });
  } catch (error) {
    console.error("Email verification failed:", error);

    res.status(500).json({
      message: "Unable to verify email right now.",
    });
  }
}
