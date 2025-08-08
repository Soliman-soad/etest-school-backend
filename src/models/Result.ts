import mongoose, { Schema, Document } from "mongoose";

export interface IResult extends Document {
  user: mongoose.Types.ObjectId;
  step: number;
  score: number; // percentage
  correct: number;
  total: number;
  awardedLevel: string;
  createdAt: Date;
}

const ResultSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    step: { type: Number, required: true },
    score: { type: Number, required: true },
    correct: { type: Number, required: true },
    total: { type: Number, required: true },
    awardedLevel: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IResult>("Result", ResultSchema);