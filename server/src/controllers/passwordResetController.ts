import type {Request, Response} from "express";
import { requestPasswordReset } from "../services/passwordResetService.js";

//POST api/auth/forgor passowrd
export async function forgotPassword(
    req: Request,
    res: Response
): Promise<void> {
    const {email} = req.body ?? {};

    if(typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
        res.status(400).json({
            message: "Please provide a valid email address",
        });
        return;
    }

    try{
        await requestPasswordReset(email);
        res.status(200).json({
            message: "If an account exists with that email, a password reset link will be sent"
            });
    } catch (error) {
        console.error("Password reset request failed:", error);
        res.status(500).json({
            message: "Unable to process your request at this time."
        })
    }  
}

// POST api/auth/reset-pass
export async function resetPassword(
    req: Request,
    res: Response
): Promise<void> {
    const{token, newPassword} = req.body ?? {};

    if(typeof token !== "string" || !/^[a-fA-F0-9]{64}$/.test(token)){
        res.status(400).json({
            message: "Invalid reset token format.",
        });
        return;
    }

    if(typeof newPassword !== "string" ||
        newPassword.length < 8 ||
        newPassword.length > 128
    ){
        res.status(400).json({
            message: "Password must be between 8 and 128 characters long."
        });
        return;
    }

    // TODO: Connect to AuthToken and User models.
    // Verify token hash and expiration, update passwordHash
    // using the team's approved password hasher, and consume
    // the token atomically to prevent reuse.

    res.status(501).json({
        message: "Password reset is not yet implemented."
    });
}