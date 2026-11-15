
import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";

// Extend Express Request to include the authenticated user's ID
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Get the Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      message: "Authentication token is required.",
    });
    return;
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    res.status(401).json({
      message: "Authentication token is required.",
    });
    return;
  }

  // Get the JWT secret
  const secretKey = process.env.JWT_SECRET;

  if (!secretKey) {
    console.error("JWT_SECRET is not configured");

    res.status(500).json({
      message: "Server authentication configuration error.",
    });
    return;
  }

  try {
    // Verify token signature and expiration
    const decoded = jwt.verify(token, secretKey, {
      algorithms: ["HS256"],
    });

    // Check that the token contains a valid user ID
    if (
      typeof decoded === "string" ||
      typeof (decoded as JwtPayload).id !== "string" ||
      !mongoose.isValidObjectId((decoded as JwtPayload).id)
    ) {
      res.status(401).json({
        message: "Invalid authentication token.",
      });
      return;
    }

    const userId = (decoded as JwtPayload).id as string;

    // Confirm that the user still exists in MongoDB
    const user = await User.findById(userId);

    if (!user) {
      res.status(401).json({
        message: "User account not found.",
      });
      return;
    }

    // Confirm that the user's email is verified
    if (!user.emailVerified) {
      res.status(403).json({
        message: "Please verify your email before continuing.",
      });
      return;
    }

    // Store the authenticated user's ID for the controller
    req.userId = userId;

    // Continue to the protected route
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        message: "Invalid or expired authentication token.",
      });
      return;
    }

    console.error("Authentication middleware error:", error);

    res.status(500).json({
      message: "Internal server error.",
    });
  }
}