import mongoose, { Schema, Document } from 'mongoose';

export interface IAvailabilitySlot {
    // Sunday = 0, Saturday = 6. Times are minutes after midnight in EST.
    dayOfWeek: number;
    startMinute: number;
    endMinute: number;
}

export interface IUserProfile {
    major: string;
    courses: string[];
    availability: IAvailabilitySlot[];
    gender?: string;
}

const AvailabilitySlotSchema = new Schema<IAvailabilitySlot>(
    {
        dayOfWeek: { type: Number, required: true, min: 0, max: 6, validate: Number.isInteger },
        startMinute: { type: Number, required: true, min: 0, max: 1439, validate: Number.isInteger },
        endMinute: { type: Number, required: true, min: 1, max: 1440, validate: Number.isInteger },
    },
    { _id: false }
);

AvailabilitySlotSchema.pre('validate', function () {
    if (this.endMinute <= this.startMinute) {
        this.invalidate('endMinute', 'End time must be after start time; split overnight availability across two days.');
    }
});

const UserProfileSchema = new Schema<IUserProfile>(
    {
        major: { type: String, required: true, trim: true },
        courses: {
            type: [{ type: String, required: true, trim: true, uppercase: true }],
            default: [],
        },
        availability: {
            type: [AvailabilitySlotSchema],
            default: [],
        },
        gender: { type: String, required: false, trim: true },
    },
    { _id: false }
);

// Shape of the User
export interface IUser extends Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    emailVerified: boolean;
    profile: IUserProfile;
}

// User Schema
const UserSchema: Schema = new Schema<IUser>(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true, // Every User have a unique email
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            select: false, // Exclude from query
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        profile: {
            type: UserProfileSchema,
        },
    },
    {
        timestamps: true,
    }
);

// Create User model (collection) from the schema
export default mongoose.model<IUser>('User', UserSchema);
