import { Router } from "express";
import authController from "@controllers/authController";
import { authMiddleware } from "@middleware/authMiddleware";

const router = Router();

// Public routes
router.post("/register/client", authController.registerClient);
router.post("/login", authController.login);
router.post("/google", authController.googleLogin);
router.post("/validate-email", authController.validateEmail);
router.get("/verify-email", authController.verifyEmail);
router.post(
  "/resend-verification-email",
  authController.resendVerificationEmail
);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);

// Account & security (authenticated, every role)
router.post("/change-password", authMiddleware, authController.changePassword);
router.get("/sessions", authMiddleware, authController.getSessions);
router.delete("/sessions/:sessionId", authMiddleware, authController.revokeSession);
router.post("/sessions/logout-others", authMiddleware, authController.logoutOtherSessions);
router.get("/login-activity", authMiddleware, authController.getLoginActivity);

export default router;
