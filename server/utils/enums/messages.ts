export enum Messages {
  // Validation / Errors
  VALIDATION_ERROR = "Validation error",
  UNAUTHORIZED = "Unauthorized access",
  FORBIDDEN = "Access forbidden",
  NOT_FOUND = "Resource not found",
  SERVER_ERROR = "An unexpected error occurred",

  // Auth: Signup/Login
  INVALID_EMAIL= "Invalid email format.",
  WEAK_PASSWORD= "Password is too weak. Must include upper case, lower case, numbers and symbols.",
  PASSWORDS_DO_NOT_MATCH= "Passwords do not match.",
  EMAIL_ALREADY_IN_USE= "Email already in use.",
  CLIENT_REGISTERED= "Client registered successfully",
  EMAIL_ALREADY_REGISTERED_NOT_VERIFIED= "Email already registered but not verified. Resend verification email?",
  INVALID_CREDENTIALS= "Invalid credentials",
  LOGIN_WITH_GOOGLE= "Please log in with Google",
  EMAIL_NOT_VERIFIED= "Email not verified",
  EMAIL_VERIFIED= "Email verified successfully",
  VERIFICATION_EMAIL_RESENT= "Verification email resent successfully",
  EMAIL_ALREADY_VERIFIED= "Email already Verified",
  EMAIL_NOT_FOUND= "Email not found",
  RESET_LINK_SENT= "If the email exists, a reset link has been sent.",
  PASSWORD_RESET_SUCCESS= "Password reset successfully",
  LOGOUT_SUCCESS= "Logged out successfully",

  // Auth: Tokens
  REFRESH_TOKEN_MISSING = "Refresh token not found",
  REFRESH_TOKEN_INVALID = "Invalid refresh token",
  TOKEN_MISSING = "Access token is missing",
  INVALID_TOKEN = "Invalid token",
}
