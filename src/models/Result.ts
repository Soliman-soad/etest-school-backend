
import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser } from "./User";

export interface IResult extends Document {
  user: mongoose.Types.ObjectId | IUser;
  step: number;
  score: number;
  correct: number;
  total: number;
  awardedLevel: string | null;
  createdAt: Date;
  updatedAt: Date;
  determineCertifiedLevel(): string | null;
}

interface IResultModel extends Model<IResult> {
  calculateResults(
    userId: mongoose.Types.ObjectId,
    step: number,
    correctAnswers: number,
    totalQuestions: number
  ): Promise<IResult>;
}

const ResultSchema: Schema = new Schema(
  {
    user: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: [true, 'User reference is required'] 
    },
    step: { 
      type: Number, 
      required: [true, 'Step number is required'],
      min: [1, 'Step must be at least 1'],
      max: [3, 'Step cannot exceed 3']
    },
    score: { 
      type: Number, 
      required: [true, 'Score is required'],
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100%']
    },
    correct: { 
      type: Number, 
      required: [true, 'Correct answers count is required'],
      min: [0, 'Correct answers cannot be negative']
    },
    total: { 
      type: Number, 
      required: [true, 'Total questions count is required'],
      min: [1, 'Total questions must be at least 1']
    },
    awardedLevel: { 
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2", null],
      default: null
    }
  },
  { 
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      }
    }
  }
);


ResultSchema.methods.determineCertifiedLevel = function(): string | null {
  const score = this.score;
  
  switch (this.step) {
    case 1:
      if (score < 25) return null; 
      if (score >= 25 && score < 50) return "A1";
      if (score >= 50 && score < 75) return "A2";
      return "A2"; 
      
    case 2:
      if (score < 25) return "A2"; 
      if (score >= 25 && score < 50) return "B1";
      if (score >= 50 && score < 75) return "B2";
      return "B2"; 
      
    case 3:
      if (score < 25) return "B2"; 
      if (score >= 25 && score < 50) return "C1";
      return "C2"; 
      
    default:
      return null;
  }
};


ResultSchema.statics.calculateResults = async function(
  userId: mongoose.Types.ObjectId,
  step: number,
  correctAnswers: number,
  totalQuestions: number
): Promise<IResult> {
  const score = Math.round((correctAnswers / totalQuestions) * 100);
  
  const result = new this({
    user: userId,
    step,
    score,
    correct: correctAnswers,
    total: totalQuestions
  });
  
  
  result.awardedLevel = result.determineCertifiedLevel();
  
  await result.save();
  return result;
};


ResultSchema.index({ user: 1 });
ResultSchema.index({ user: 1, step: 1 }, { unique: true });

export default mongoose.model<IResult, IResultModel>("Result", ResultSchema);