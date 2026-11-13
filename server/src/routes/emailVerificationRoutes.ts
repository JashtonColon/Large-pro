
import { Router } from "express";
import {
  sendVerification,
  verifyEmail,
} from "../controllers/emailVerificationController.js";

const router = Router();

router.post("/send-verification", sendVerification);
router.post("/verify-email", verifyEmail);

export default router;
