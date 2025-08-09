import { Request, Response } from "express";
import mongoose from "mongoose";
import Question, { Level } from "../models/Question";
import Result from "../models/Result";

export const getTestQuestions = async (req: Request, res: Response) => {
  try {
    const { step } = req.query;
    const stepNumber = parseInt(step as string);

    if (![1, 2, 3].includes(stepNumber)) {
      return res.status(400).json({ message: "Invalid test step" });
    }

    let levels: Level[];
    switch (stepNumber) {
      case 1:
        levels = ["A1", "A2"];
        break;
      case 2:
        levels = ["B1", "B2"];
        break;
      case 3:
        levels = ["C1", "C2"];
        break;
      default:
        levels = [];
    }

    const questions = await Question.aggregate([
      { $match: { level: { $in: levels } } },
      { $sample: { size: 44 } },
      { $project: { answerIndex: 0, __v: 0, createdAt: 0, updatedAt: 0 } },
    ]);

    res.json(questions);
  } catch (error) {
    console.error("Error fetching test questions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const submitTest = async (req: Request, res: Response) => {
  try {
    const { step, answers } = req.body;
    const userId = req.user.id;

    if (![1, 2, 3].includes(step)) {
      return res.status(400).json({ message: "Invalid test step" });
    }

    const existingResult = await Result.findOne({ user: userId, step });
    if (existingResult) {
      return res.status(400).json({ message: "Test step already completed" });
    }

    if (step === 1) {
      const previousAttempt = await Result.findOne({
        user: userId,
        step: 1,
        score: { $lt: 25 },
      });

      if (previousAttempt) {
        return res.status(403).json({
          message: "You failed step 1 and cannot retake it",
        });
      }
    }

    const questionIds = Object.keys(answers);
    const questions = await Question.find({
      _id: { $in: questionIds.map((id) => new mongoose.Types.ObjectId(id)) },
    });

    let correct = 0;
    questions.forEach((question) => {
      if (answers[question._id] === question.answerIndex) {
        correct++;
      }
    });

    const total = questions.length;
    const result = await Result.calculateResults(userId, step, correct, total);

    res.json({
      result,
      nextStep: step < 3 && result.score >= 75 ? step + 1 : null,
    });
  } catch (error) {
    console.error("Error submitting test:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTestResults = async (req: Request, res: Response) => {
  try {
    const results = await Result.find({ user: req.user.id })
      .sort({ step: 1 })
      .select("-__v -createdAt -updatedAt");

    res.json(results);
  } catch (error) {
    console.error("Error fetching test results:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCertification = async (req: Request, res: Response) => {
  try {
    const result = await Result.findOne({ user: req.user.id })
      .sort({ awardedLevel: -1 })
      .limit(1);

    if (!result || !result.awardedLevel) {
      return res.status(404).json({ message: "No certification achieved" });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching certification:", error);
    res.status(500).json({ message: "Server error" });
  }
};
