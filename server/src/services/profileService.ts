import User, { type IUserProfile } from '../models/User.js';
import { normalizeCourse } from '../utils/courseUtils.js';

export class ProfileError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
    }
}

export function parseProfileInput(input: unknown, creating: boolean): Partial<IUserProfile> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new ProfileError(400, 'Please provide profile fields.');
    }
    const data = input as Record<string, unknown>;
    const result: Partial<IUserProfile> = {};
    if (creating || data.major !== undefined) {
        if (typeof data.major !== 'string' || !data.major.trim()) {
            throw new ProfileError(400, 'Major is required.');
        }
        result.major = data.major.trim();
    }
    if (creating || data.courses !== undefined) {
        if (!Array.isArray(data.courses) || (creating && !data.courses.length) ||
            !data.courses.every(course => typeof course === 'string' && course.trim())) {
            throw new ProfileError(400, 'Provide courses as an array of nonempty course codes.');
        }
        result.courses = [...new Set(data.courses.map(normalizeCourse))];
    }
    if (creating || data.availability !== undefined) {
        if (!Array.isArray(data.availability) || (creating && !data.availability.length)) {
            throw new ProfileError(400, 'Provide at least one weekly availability slot.');
        }
        result.availability = data.availability.map(slot => {
            if (!slot || typeof slot !== 'object' ||
                !Number.isInteger(slot.dayOfWeek) || slot.dayOfWeek < 0 || slot.dayOfWeek > 6 ||
                !Number.isInteger(slot.startMinute) || slot.startMinute < 0 || slot.startMinute > 1439 ||
                !Number.isInteger(slot.endMinute) || slot.endMinute > 1440 || slot.endMinute <= slot.startMinute) {
                throw new ProfileError(400, 'Availability requires a day (0–6) and start/end minutes (0–1440), with end after start.');
            }
            return { dayOfWeek: slot.dayOfWeek, startMinute: slot.startMinute, endMinute: slot.endMinute };
        });
    }
    if (data.gender !== undefined) {
        if (typeof data.gender !== 'string') {
            throw new ProfileError(400, 'Gender must be text.');
        }
        result.gender = data.gender.trim();
    }
    return result;
}

export async function getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new ProfileError(404, 'User not found.');
    return user.profile ?? null;
}

export async function saveProfile(userId: string, input: unknown, creating: boolean) {
    const fields = parseProfileInput(input, creating);
    const updates = Object.fromEntries(Object.entries(fields).map(([key, value]) => [`profile.${key}`, value]));
    // Atomic existence check prevents two setup requests from overwriting each other.
    const user = await User.findOneAndUpdate(
        { _id: userId, 'profile.major': { $exists: !creating } },
        { $set: updates },
        { new: true, runValidators: true },
    );
    if (!user) throw new ProfileError(creating ? 409 : 404,
        creating ? 'Profile already exists. Edit it instead.' : 'Create your academic profile first.');
    return user.profile;
}
