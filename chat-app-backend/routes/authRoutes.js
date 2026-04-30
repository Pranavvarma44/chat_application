import express from "express";
import { register, login, verifyOtp } from "../controllers/authController.js";
import { resendOtp } from "../controllers/authController.js";

const router = express.Router();


router.post("/register", register);
router.post("/verify-otp",verifyOtp);
router.post("/login", login);
router.post("/resend-otp", resendOtp);

export default router;