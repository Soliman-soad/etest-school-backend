import { Request, Response } from "express";
import Question from "../models/Question";
import Result from "../models/Result";
import mongoose from "mongoose";

// helper to map step -> levels
const STEP_LEVELS: Record<number, string[]> = {
  1: ["A1", "A2"],
  2: ["B1", "B2"],
  3: ["C1", "C2"]
};

export const fetchQuestionsForStep = async (req: Request, res: Response) => {
  const { step } = req.params;
  const stepNum = Number(step);
  if (![1, 2, 3].includes(stepNum)) return res.status(400).json({ message: "Invalid step" });

  const levels = STEP_LEVELS[stepNum];
  // We need 44 questions: 22 competencies x 2 levels -> assume questions are present
  // For simplicity: sample 44 documents matching the levels
  const questions = await Question.aggregate([
    { $match: { level: { $in: levels } } },
    { $sample: { size: 44 } },
    { $project: { answerIndex: 0 } } // do not send answers
  ]);

  res.json({ questions });
};

export const submitAnswers = async (req: Request, res: Response) => {
  const user = req.user;
  const { step } = req.params;
  const stepNum = Number(step);
  const answers: { questionId: string; answerIndex: number }[] = req.body.answers;

  if (!answers || !Array.isArray(answers)) return res.status(400).json({ message: "Answers required" });

  // Fetch correct answers for submitted question IDs
  const ids = answers.map((a) => new mongoose.Types.ObjectId(a.questionId));
  const questions = await Question.find({ _id: { $in: ids } });
  const total = questions.length;
  let correct = 0;

  const map = new Map<string, number>();
  questions.forEach((q) => map.set(q._id.toString(), q.answerIndex));

  answers.forEach((a) => {
    const correctIndex = map.get(a.questionId);
    if (correctIndex !== undefined && correctIndex === a.answerIndex) correct++;
  });

  const score = (correct / total) * 100;
  let awardedLevel = determineAwardedLevel(stepNum, score);

  // Save result
  await Result.create({ user: user.id, step: stepNum, score, correct, total, awardedLevel });

  res.json({ score, correct, total, awardedLevel });
};

const determineAwardedLevel = (step: number, score: number) => {
  // Implement scoring rules from spec
  if (step === 1) {
    if (score < 25) return "Fail";
    if (score < 50) return "A1";
    if (score < 75) return "A2";
    return "A2+Proceed";
  }
  if (step === 2) {
    if (score < 25) return "Remain A2";
    if (score < 50) return "B1";
    if (score < 75) return "B2";
    return "B2+Proceed";
  }
  if (step === 3) {
    if (score < 25) return "Remain B2";
    if (score < 50) return "C1";
    return "C2";
  }
  return "";
};
