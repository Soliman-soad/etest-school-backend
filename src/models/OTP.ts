import mongoose, { Schema, Document } from "mongoose";

export interface IOTP extends Document {
  identifier: string; // email or phone
  code: string;
  expiresAt: Date;
}

const OTPSchema: Schema = new Schema(
  {
    identifier: { type: String, required: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

export default mongoose.model<IOTP>("OTP", OTPSchema);

