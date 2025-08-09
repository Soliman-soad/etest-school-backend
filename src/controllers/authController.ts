import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import { signAccessToken, signRefreshToken } from "../utils/jwt";
import { generateOTP, verifyOTP } from "../utils/otpService";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const register = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing)
    return res.status(400).json({ message: "Email already registered" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed, role });

  const code = await generateOTP(email);
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: email,
    subject: "Your verification code",
    text: `Your verification code is ${code}`,
  });

  res.status(201).json({ message: "User created, OTP sent to email" });
};

export const verify = async (req: Request, res: Response) => {
  const { email, code } = req.body;
  const ok = await verifyOTP(email, code);
  if (!ok) return res.status(400).json({ message: "Invalid or expired code" });
  const user = await User.findOneAndUpdate(
    { email },
    { verified: true },
    { new: true }
  );
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "Verified" });
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const payload = { id: user._id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Login successful" });
  } catch (err) {
    console.log(err);
  }
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token" });

  try {
    const payload = (await import("jsonwebtoken")).verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || "refresh_secret"
    ) as any;
    const accessToken = signAccessToken({
      id: payload.id,
      email: payload.email,
      role: payload.role,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ message: "Token refreshed" });
  } catch (err) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

export const logOut = async (_req: Request, res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    console.log(err);
  }
};
