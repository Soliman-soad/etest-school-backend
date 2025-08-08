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
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing)
    return res.status(400).json({ message: "Email already registered" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed });

  // generate OTP and send email
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
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Invalid credentials" });

  const payload = { id: user._id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.json({ accessToken, refreshToken });
};

export const refresh = async (req: Request, res: Response) => {
  const { token } = req.body;
  try {
    const payload = (await import("jsonwebtoken")).verify(
      token,
      process.env.JWT_REFRESH_SECRET || "refresh_secret"
    ) as any;
    const accessToken = signAccessToken({
      id: payload.id,
      email: payload.email,
      role: payload.role,
    });
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};
