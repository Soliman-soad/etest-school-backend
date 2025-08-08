import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth";
import Question from "../models/Question";

const router = Router();

// create question (admin only)
router.post("/question", authenticate, authorize(["admin"]), async (req, res) => {
  const { competency, level, text, options, answerIndex } = req.body;
  const q = await Question.create({ competency, level, text, options, answerIndex });
  res.status(201).json(q);
});

// list questions with pagination
router.get("/questions", authenticate, authorize(["admin"]), async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const total = await Question.countDocuments();
  const questions = await Question.find().skip(skip).limit(limit);
  res.json({ questions, page, totalPages: Math.ceil(total / limit), total });
});

export default router;