import { Request, Response } from "express";
import {
    isValidRegisterInput,
    isValidLoginInput,
} from "../utils/authValidation.js";

import {
    registerUser,
    loginUser,
    AuthError, // Class
} from "../services/authService.js";

import { generateToken } from "../utils/generateToken.js";

const handleAuthError = (error: unknown, res: Response): void => {
    if (error instanceof AuthError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }

    console.error("Authentication error:", error);

    res.status(500).json({ message: "Internal server error" });
};

// POST /api/auth/register
export const register = async (
req: Request,
res: Response
): Promise<void> => {
    try {
        const input: unknown = req.body;

        if (!isValidRegisterInput(input)) {
            res.status(400).json({ message: "Invalid registration input" });
            return;
        }
        
        const user = await registerUser(input);

        res.status(201).json({
            message: "User registered successfully",
            user,
        });
    } catch (error) {
        handleAuthError(error, res);
    }
};

// POST /api/auth/login
export const login = async (
req: Request,
res: Response
): Promise<void> => {
    try {
        const input: unknown = req.body;
        
        if (!isValidLoginInput(input)) {
            res.status(400).json({ message: "Invalid login input" });
            return;
        }

        const user = await loginUser(input);
        const token = generateToken(user.id);

        res.status(200).json({ message: "Login successful", token, user });
    } catch (error) {
        handleAuthError(error, res);
    }
};