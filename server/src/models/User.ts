import mongoose, { Schema, Document } from 'mongoose';

// Shape of the User
export interface IUser extends Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
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
    },
    {
        timestamps: true,
    }
);

// Create User model (collection) from the schema
export default mongoose.model<IUser>('User', UserSchema);