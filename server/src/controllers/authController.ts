import { Request, Response } from "express";
import {
    isValidRegisterInput,
    isValidLoginInput,
} from "../utils/authValidation.js";

// POST /api/auth/register
export const register = async (
req: Request,
res: Response
): Promise<void> => {
    try {
        if (!isValidRegisterInput(req.body)) {
            res.status(400).json({ message: "Invalid registration input" });
            return;
        }
        
        const { firstName, lastName, email, password } = req.body;

        res.status(200).json({ 
            message: "Registration request received", 
            user: { firstName, lastName, email } });
    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({ message: "Internal server error" });
    }
};

// POST /api/auth/login
export const login = async (
req: Request,
res: Response
): Promise<void> => {
    try {
        if (!isValidLoginInput(req.body)) {
            res.status(400).json({ message: "Invalid login input" });
            return;
        }

        res.status(200).json({ message: "Login request received" });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({ message: "Internal server error" });
    }
};