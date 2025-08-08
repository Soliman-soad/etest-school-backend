import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";

export const signAccessToken = (payload: object) => {
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRES || "15m";
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn });
};

export const signRefreshToken = (payload: object) => {
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES || "7d";
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn });
};