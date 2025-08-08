import mongoose, { Schema, Document } from "mongoose";

export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface IQuestion extends Document {
  competency: string;
  level: Level;
  text: string;
  options: string[];
  answerIndex: number;
}

const QuestionSchema: Schema = new Schema(
  {
    competency: { type: String, required: true },
    level: { type: String, enum: ["A1", "A2", "B1", "B2", "C1", "C2"], required: true },
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    answerIndex: { type: Number, required: true }
  },
  { timestamps: true }
);

export default mongoose.model<IQuestion>("Question", QuestionSchema);