import { Router } from "express";
import * as testCtrl from "../controllers/testController";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.get("/questions/:step", authenticate, testCtrl.fetchQuestionsForStep);
router.post("/submit/:step", authenticate, testCtrl.submitAnswers);

export default router;