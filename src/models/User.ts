import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "student" | "supervisor";
  verified: boolean;
  createdAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "student", "supervisor"], default: "student" },
    verified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);