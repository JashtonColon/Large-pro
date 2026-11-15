
import mongoose, { Schema, Document } from "mongoose";

export interface IQuest extends Document {
  title: string;
  subject: string;
  location: string;
  description?: string;
  author: mongoose.Types.ObjectId;
  day: Date;
  startTime: string;
  endTime: string;
  members: mongoose.Types.ObjectId[];
  maxMember: number;
  status: "open" | "closed";
}

const questSchema = new Schema<IQuest>({
  title: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  location: { type: String, required: true },
  description: { type: String },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  day: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  members: {
  type: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
  default: []
 },
  maxMember: { type: Number, required: true, min: 1, validate: Number.isInteger },
  status: {
    type: String,
    enum: ["open", "closed"],
    default: "open"
  }
}, { timestamps: true });

export default mongoose.model<IQuest>("Quest", questSchema);
