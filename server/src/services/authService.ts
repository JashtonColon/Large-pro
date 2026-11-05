import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import type {
  RegisterInput,
  LoginInput,
} from "../utils/authValidation.js";

interface StoredUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
}

interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Temporary user storage until MongoDB is available.
const users = new Map<string, StoredUser>();

export class AuthError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
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

  if (users.has(email)) {
    throw new AuthError(409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user: StoredUser = {
    id: randomUUID(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email,
    passwordHash,
  };

  users.set(email, user);

  return toPublicUser(user);
}

// Authenticate an existing user
export async function loginUser(
  input: LoginInput
): Promise<PublicUser> {
  const email = input.email.trim().toLowerCase();
  const user = users.get(email);

  if (!user) {
    throw new AuthError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(
    input.password,
    user.passwordHash
  );

  if (!isPasswordValid) {
    throw new AuthError(401, "Invalid email or password");
  }

  return toPublicUser(user);
}