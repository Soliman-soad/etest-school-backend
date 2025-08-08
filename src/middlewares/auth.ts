import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, ACCESS_SECRET) as any;
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const authorize = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
  next();
};