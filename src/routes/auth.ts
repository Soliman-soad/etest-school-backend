import { Router } from "express";
import * as authCtrl from "../controllers/authController";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.post("/register", authCtrl.register);
router.post("/verify", authCtrl.verify);
router.post("/login", authCtrl.login);
router.post("/refresh", authCtrl.refresh);
router.get("/me", authenticate, authCtrl.getUser);
router.post("/logout", authCtrl.logOut);

export default router;
