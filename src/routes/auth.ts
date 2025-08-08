import { Router } from "express";
import * as authCtrl from "../controllers/authController";

const router = Router();

router.post("/register", authCtrl.register);
router.post("/verify", authCtrl.verify);
router.post("/login", authCtrl.login);
router.post("/refresh", authCtrl.refresh);

export default router;