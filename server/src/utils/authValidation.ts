export interface RegisterInput {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

const isNonEmptyString = (value: unknown): value is string => {
    return typeof value === "string" && value.trim().length > 0;
};

const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isValidRegisterInput = (data: unknown): data is RegisterInput => {
    if (!data || typeof data !== "object") {
        return false;
    }

    const { firstName, lastName, email, password } = data as Record<string, unknown>;

    return (
        isNonEmptyString(firstName) &&
        isNonEmptyString(lastName) &&
        isNonEmptyString(email) &&
        isValidEmail(email) &&
        isNonEmptyString(password)
    );
};

export const isValidLoginInput = (data: unknown): data is LoginInput => {
    if (!data || typeof data !== "object") {
        return false;
    }

    const { email, password } = data as Record<string, unknown>;

    return (
        isNonEmptyString(email) &&
        isValidEmail(email) &&
        isNonEmptyString(password)
    );
};