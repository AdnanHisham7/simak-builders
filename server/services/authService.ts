import bcrypt from "bcryptjs";
import crypto from "crypto";
import { signToken, verifyToken } from "@utils/jwt";
import { UserRole } from "@entities/user";

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const generateAccessToken = (
  userId: string,
  role: UserRole,
  sessionId: string
): string => {
  return signToken({ userId, role, sessionId }, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (
  userId: string,
  role: UserRole,
  sessionId: string
): string => {
  return signToken(
    { userId, role, sessionId },
    process.env.JWT_REFRESH_SECRET!,
    {
      expiresIn: "7d",
    }
  );
};

export const generateVerificationToken = (userId: string): string => {
  return signToken({ userId }, process.env.JWT_SECRET!, { expiresIn: "1d" });
};

export const generateResetToken = (userId: string): string => {
  return signToken({ userId }, process.env.JWT_SECRET!, { expiresIn: "1h" });
};

export const generateTempPassword = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const verifyRefreshToken = (
  token: string
): { userId: string; role: UserRole; sessionId?: string } => {
  return verifyToken(token, process.env.JWT_REFRESH_SECRET!);
};

export const verifyVerificationToken = (token: string): string => {
  return verifyToken(token, process.env.JWT_SECRET!).userId;
};

export const verifyResetToken = (token: string): string => {
  return verifyToken(token, process.env.JWT_SECRET!).userId;
};
