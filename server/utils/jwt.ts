import jwt, { SignOptions } from "jsonwebtoken";
import { UserRole } from "@entities/user";

export const signToken = (
  payload: object,
  secret: string,
  options?: SignOptions
): string => {
  return jwt.sign(payload, secret, options);
};

export function verifyToken(
  token: string,
  secret: string
): { userId: string; role: UserRole; sessionId?: string } {
  if (!token || typeof token !== "string") {
    throw new Error("Token is missing or invalid");
  }

  if (!secret) {
    throw new Error("JWT secret is not configured");
  }

  try {
    return jwt.verify(token, secret) as {
      userId: string;
      role: UserRole;
      sessionId?: string;
    };
  } catch (error) {
    throw new Error("Invalid token");
  }
}
