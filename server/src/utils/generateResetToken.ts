import {randomBytes, createHash} from "node:crypto";

export function generateResetToken(){
    //cryptographically secure random token
    const token = randomBytes(32).toString("hex");

    //Hash the token
    const tokenHash = createHash("sha256").update(token).digest("hex");

    return{
        token,
        tokenHash
    };
}