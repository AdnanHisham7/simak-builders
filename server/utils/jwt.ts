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
): { userId: string; role: UserRole } {
  if (!token || typeof token !== "string") {
    throw new Error("Token is missing or invalid");
  }

  if (!secret) {
    throw new Error("JWT secret is not configured");
  }

  console.log(token, secret, "jiji")

  try {
    return jwt.verify(token, secret) as {
      userId: string;
      role: UserRole
    };
  } catch (error) {
    console.error("JWT verification error:", error);
    throw new Error("Invalid token");
  }
}
