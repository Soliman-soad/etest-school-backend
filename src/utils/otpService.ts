import OTPModel from "../models/OTP";

export const generateOTP = async (identifier: string) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  await OTPModel.create({ identifier, code, expiresAt });
  return code;
};

export const verifyOTP = async (identifier: string, code: string) => {
  const record = await OTPModel.findOne({ identifier, code }).sort({
    createdAt: -1,
  });
  if (!record) return false;
  if (record.expiresAt < new Date()) return false;
  await OTPModel.deleteMany({ identifier });
  return true;
};
