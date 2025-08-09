import { Router } from "express";
import { generateCertificate, getUserCertification } from "../controllers/certificateController";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.get("/user", authenticate, getUserCertification);
router.post("/generate", authenticate, generateCertificate);

export default router;