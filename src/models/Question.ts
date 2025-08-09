
import mongoose, { Schema, Document } from "mongoose";

export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";


export enum Competency {
  INFORMATION_BROWSING = "Information Browsing",
  INFORMATION_EVALUATION = "Information Evaluation",
  INFORMATION_MANAGEMENT = "Information Management",
  PERSONAL_DATA_PROTECTION = "Personal Data Protection",
  DEVICE_PROTECTION = "Device Protection",
  HEALTH_PROTECTION = "Health Protection",
  ENVIRONMENT_PROTECTION = "Environment Protection",
  TECHNICAL_PROBLEM_SOLVING = "Technical Problem Solving",
  NEEDS_IDENTIFICATION = "Needs Identification",
  DIGITAL_TOOL_SELECTION = "Digital Tool Selection",
  TECHNOLOGY_CREATIVE_USE = "Technology Creative Use",
  DIGITAL_COMPETENCE_GAPS = "Digital Competence Gaps",
  COPYRIGHT_LICENSES = "Copyright and Licenses",
  PROGRAMMING = "Programming",
  DIGITAL_COMMUNICATION = "Digital Communication",
  CONTENT_SHARING = "Content Sharing",
  ONLINE_PARTICIPATION = "Online Participation",
  COLLABORATION = "Collaboration",
  NETIQUETTE = "Netiquette",
  DIGITAL_IDENTITY_MANAGEMENT = "Digital Identity Management",
  DIGITAL_CONTENT_DEVELOPMENT = "Digital Content Development",
  DIGITAL_CONTENT_INTEGRATION = "Digital Content Integration"
}

export interface IQuestion extends Document {
  competency: string;
  level: Level;
  text: string;
  options: string[];
  answerIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema: Schema = new Schema(
  {
    competency: { 
      type: String, 
      required: [true, 'Competency is required'],
      trim: true,
      maxlength: [100, 'Competency cannot exceed 100 characters']
    },
    level: { 
      type: String, 
      enum: {
        values: ["A1", "A2", "B1", "B2", "C1", "C2"],
        message: 'Level must be one of: A1, A2, B1, B2, C1, C2'
      },
      required: [true, 'Level is required']
    },
    text: { 
      type: String, 
      required: [true, 'Question text is required'],
      trim: true,
      minlength: [10, 'Question text must be at least 10 characters'],
      maxlength: [500, 'Question text cannot exceed 500 characters']
    },
    options: { 
      type: [String], 
      required: [true, 'Options are required'],
      validate: {
        validator: (options: string[]) => options.length >= 2 && options.length <= 5,
        message: 'Questions must have between 2 and 5 options'
      }
    },
    answerIndex: { 
      type: Number, 
      required: [true, 'Answer index is required'],
      min: [0, 'Answer index cannot be negative'],
      validate: {
        validator: function(this: IQuestion, value: number) {
          return value >= 0 && value < this.options.length;
        },
        message: 'Answer index must be a valid option index'
      }
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


QuestionSchema.index({ competency: 1, level: 1 });
QuestionSchema.index({ level: 1 });

export default mongoose.model<IQuestion>("Question", QuestionSchema);