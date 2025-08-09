import { Router } from "express";
import * as testCtrl from "../controllers/testController";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.get("/questions", authenticate, testCtrl.getTestQuestions);
router.post("/submit", authenticate, testCtrl.submitTest);
router.get("/results", authenticate, testCtrl.getTestResults);
router.get("/certificate", authenticate, testCtrl.getCertification);

export default router; 
