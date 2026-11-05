import jwt from "jsonwebtoken";

export const generateToken = (userId: string): string => {
    const secretKey = process.env.JWT_SECRET;

    if (!secretKey) {
        throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign({ 
        id: userId }, 
        secretKey, 
        { expiresIn: "1h", algorithm: "HS256" }
    );
    return token;
};
    