import { Router } from "express";
import { generateCertificate } from "../controllers/certificateController";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.post("/generate", authenticate, generateCertificate);

export default router;