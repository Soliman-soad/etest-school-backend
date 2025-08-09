import { Request, Response } from "express";
import mongoose from "mongoose";
import Question, { Level } from "../models/Question";
import Result from "../models/Result";

const STEP_TIME_LIMITS = {
  1: 30,
  2: 45,
  3: 60,
};

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

    
    const questions = [];

    
    for (const level of levels) {
      const levelQuestions = await Question.aggregate([
        { $match: { level } },
        { $sample: { size: 22 } }, 
        { $project: { answerIndex: 0, __v: 0, createdAt: 0, updatedAt: 0 } },
      ]);
      (questions as any[]).push(...levelQuestions);
    }

    
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5);

    res.json({
      questions: shuffledQuestions,
      timeLimit: STEP_TIME_LIMITS[stepNumber as keyof typeof STEP_TIME_LIMITS],
    });
  } catch (error) {
    console.error("Error fetching test questions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const submitTest = async (req: Request, res: Response) => {
  try {
    const { step, answers, timeExpired } = req.body;
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

    
    if (step > 1) {
      
      if (step === 2) {
        const step1Result = await Result.findOne({ user: userId, step: 1 });
        if (!step1Result || step1Result.score < 75) {
          return res.status(403).json({
            message: "You must score at least 75% on Step 1 to access Step 2",
          });
        }
      }

      
      if (step === 3) {
        const step2Result = await Result.findOne({ user: userId, step: 2 });
        if (!step2Result || step2Result.score < 75) {
          return res.status(403).json({
            message: "You must score at least 75% on Step 2 to access Step 3",
          });
        }
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

    
    let nextStep = null;
    if (step < 3 && result.score >= 75) {
      nextStep = step + 1;
    }

    
    const message = timeExpired
      ? "Test auto-submitted due to time expiration"
      : "Test submitted successfully";

    res.json({
      result,
      nextStep,
      message,
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
    
    const results = await Result.find({ user: req.user.id }).sort({ step: -1 });

    if (!results || results.length === 0) {
      return res.status(404).json({ message: "No certification found" });
    }

    
    let highestLevel = "";
    const levelOrder = [null, "A1", "A2", "B1", "B2", "C1", "C2"];

    for (const result of results) {
      const currentLevel = result.awardedLevel;
      if (
        currentLevel &&
        levelOrder.indexOf(currentLevel) > levelOrder.indexOf(highestLevel)
      ) {
        highestLevel = currentLevel;
      }
    }

    if (!highestLevel) {
      return res
        .status(404)
        .json({ message: "No certification level achieved" });
    }

    res.json({
      level: highestLevel,
      results,
    });
  } catch (error) {
    console.error("Error fetching certification:", error);
    res.status(500).json({ message: "Server error" });
  }
};
