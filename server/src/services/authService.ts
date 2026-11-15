import bcrypt from "bcryptjs";
import User from "../models/User.js";
import type {
  RegisterInput,
  LoginInput,
} from "../utils/authValidation.js";
import { requestEmailVerification } from "./emailVerificationService.js";

interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export class AuthError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

function toPublicUser(user: {
  _id: { toString(): string };
  firstName: string;
  lastName: string;
  email: string;
}): PublicUser {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}

// Register a new user
export async function registerUser(
  input: RegisterInput
): Promise<PublicUser> {
  const email = input.email.trim().toLowerCase();

  if (await User.exists({ email })) {
    throw new AuthError(409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await User.create({
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email,
    password: passwordHash,
  });

  await requestEmailVerification(email);

  return toPublicUser(user);
}

// Authenticate an existing user
export async function loginUser(
  input: LoginInput
): Promise<PublicUser> {
  const email = input.email.trim().toLowerCase();
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new AuthError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(
    input.password,
    user.password
  );

  if (!isPasswordValid) {
    throw new AuthError(401, "Invalid email or password");
  }

  if(!user.emailVerified){
    throw new AuthError(403, "Please verify your email before logging in.");
  }

  return toPublicUser(user);
}