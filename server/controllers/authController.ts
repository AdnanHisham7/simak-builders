import { Request, Response, NextFunction } from "express";
import { UserModel } from "@models/User";
// import { CompanyModel } from "@models/Company";
import * as authService from "../services/authService";
import * as emailService from "../services/emailService";
import { ApiError } from "@utils/errors/ApiError";
import { HttpStatus } from "@utils/enums/httpStatus";
import { Messages } from "@utils/enums/messages";
import { isValidEmail } from "@utils/validators/emailValidator";
import { isStrongPassword } from "@utils/validators/passwordValidator";
import { setTokensCookies, clearAuthCookies } from "@utils/cookies";
import { OAuth2Client } from "google-auth-library";
import { env } from "@config/env";
import { UserRole } from "@entities/user";
import { Types } from "mongoose";
import { ActivityLogModel } from "@models/ActivityLog";
import { parseUserAgent, getRequestIp } from "@utils/deviceParser";

const MAX_SESSIONS_PER_USER = 10;

const createSessionAndTokens = async (
  user: InstanceType<typeof UserModel>,
  req: Request
) => {
  const sessionId = new Types.ObjectId();
  const accessToken = authService.generateAccessToken(
    user._id.toString(),
    user.role,
    sessionId.toString()
  );
  const refreshToken = authService.generateRefreshToken(
    user._id.toString(),
    user.role,
    sessionId.toString()
  );

  const userAgent = req.headers["user-agent"] as string | undefined;
  const ip = getRequestIp(req);
  const { browser, os, device } = parseUserAgent(userAgent);

  user.sessions.push({
    _id: sessionId,
    tokenHash: authService.hashToken(refreshToken),
    userAgent,
    ip,
    device,
    browser,
    os,
    createdAt: new Date(),
    lastUsedAt: new Date(),
  } as any);

  if (user.sessions.length > MAX_SESSIONS_PER_USER) {
    user.sessions = user.sessions
      .sort(
        (a, b) =>
          new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
      )
      .slice(0, MAX_SESSIONS_PER_USER) as any;
  }

  await recordLoginActivity(user._id.toString(), req, `${browser} on ${os}`);

  return { accessToken, refreshToken, sessionId };
};

const recordLoginActivity = async (
  userId: string,
  req: Request,
  deviceLabel: string
) => {
  try {
    await ActivityLogModel.create({
      user: userId,
      action: "login",
      resource: "auth",
      resourceId: userId,
      details: "User logged in",
      ip: getRequestIp(req),
      userAgent: req.headers["user-agent"] as string | undefined,
      device: deviceLabel,
    });
  } catch (error) {
    // Never block login on activity-log failure.
  }
};

const registerClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!isValidEmail(email)) {
      throw new ApiError(Messages.INVALID_EMAIL, HttpStatus.BAD_REQUEST);
    }
    if (!isStrongPassword(password)) {
      throw new ApiError(Messages.WEAK_PASSWORD, HttpStatus.BAD_REQUEST);
    }
    if (password !== confirmPassword) {
      throw new ApiError(
        Messages.PASSWORDS_DO_NOT_MATCH,
        HttpStatus.BAD_REQUEST
      );
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      if (!existingUser.isEmailVerified) {
        res.status(HttpStatus.OK).json({
          message: Messages.EMAIL_ALREADY_REGISTERED_NOT_VERIFIED,
          resend: true,
        });
        return;
      }
      throw new ApiError(Messages.EMAIL_ALREADY_IN_USE, HttpStatus.CONFLICT);
    }

    // const existingCompany = await CompanyModel.findOne({ email });
    // if (existingCompany) {
    //   throw new ApiError(Messages.EMAIL_ALREADY_IN_USE, HttpStatus.CONFLICT);
    // }

    const hashedPassword = await authService.hashPassword(password);
    const user = new UserModel({
      email,
      password: hashedPassword,
      isEmailVerified: false,
      role: UserRole.Client,
    });
    await user.save();
    const verificationToken = authService.generateVerificationToken(
      user._id.toString()
    );
    user.verificationToken = verificationToken;
    await user.save();
    await emailService.sendVerificationEmail(email, verificationToken);

    res
      .status(HttpStatus.CREATED)
      .json({ message: Messages.CLIENT_REGISTERED });
  } catch (error) {
    next(error);
  }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!isValidEmail(email)) {
      throw new ApiError(Messages.INVALID_EMAIL, HttpStatus.BAD_REQUEST);
    }

    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
      throw new ApiError(Messages.INVALID_CREDENTIALS, HttpStatus.BAD_REQUEST);
    }

    if (user.googleId && !user.password) {
      throw new ApiError(Messages.LOGIN_WITH_GOOGLE, HttpStatus.BAD_REQUEST);
    }

    const isPasswordValid = await authService.comparePassword(
      password,
      user.password!
    );
    if (!isPasswordValid) {
      throw new ApiError(Messages.INVALID_CREDENTIALS, HttpStatus.BAD_REQUEST);
    }

    if (!user.isEmailVerified) {
      throw new ApiError(Messages.EMAIL_NOT_VERIFIED, HttpStatus.FORBIDDEN);
    }

    if (user.isBlocked) {
      throw new ApiError("User is blocked", HttpStatus.CONFLICT);
    }

    if (user.isDeleted) {
      throw new ApiError(
        "This account has been deactivated. Please contact your administrator.",
        HttpStatus.FORBIDDEN,
      );
    }

    const { accessToken, refreshToken } = await createSessionAndTokens(
      user,
      req
    );

    await user.save();
    setTokensCookies(res, accessToken, refreshToken);
    res
      .status(HttpStatus.OK)
      .json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
          role: user.role,
          preferences: user.preferences,
        },
      });
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential } = req.body;
    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new ApiError(Messages.INVALID_CREDENTIALS, HttpStatus.BAD_REQUEST);
    }

    const { email, name, picture, sub } = payload;
    let user = await UserModel.findOne({ email });
    if (!user) {
      user = new UserModel({
        email,
        name,
        profileImage: picture,
        googleId: sub,
        isEmailVerified: true,
        role: UserRole.Client,
      });
      await user.save();
    }

    const { accessToken, refreshToken } = await createSessionAndTokens(
      user,
      req
    );
    await user.save();
    setTokensCookies(res, accessToken, refreshToken);

    res.status(HttpStatus.OK).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

const validateEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!isValidEmail(email)) {
      throw new ApiError(Messages.INVALID_EMAIL, HttpStatus.BAD_REQUEST);
    }

    const user = await UserModel.findOne({ email });

    if (user) {
      if (user && !user.isEmailVerified) {
        res.status(HttpStatus.OK).json({
          message: Messages.EMAIL_ALREADY_REGISTERED_NOT_VERIFIED,
          resend: true,
        });
      } else {
        throw new ApiError(Messages.EMAIL_ALREADY_IN_USE, HttpStatus.CONFLICT);
      }
    } else {
      res.status(HttpStatus.OK).json({ valid: true });
    }
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      throw new ApiError(Messages.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
    }

    const userId = authService.verifyVerificationToken(token);
    const user = await UserModel.findById(userId);
    if (user) {
      if (user.isEmailVerified) {
        throw new ApiError(
          Messages.EMAIL_ALREADY_VERIFIED,
          HttpStatus.CONFLICT
        );
      }
      user.isEmailVerified = true;
      await user.save();
      res.status(HttpStatus.OK).json({ message: Messages.EMAIL_VERIFIED });
      return;
    }

    throw new ApiError(Messages.INVALID_TOKEN, HttpStatus.UNAUTHORIZED);
  } catch (error) {
    next(error);
  }
};

const resendVerificationEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!isValidEmail(email)) {
      throw new ApiError(Messages.INVALID_EMAIL, HttpStatus.BAD_REQUEST);
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new ApiError(Messages.EMAIL_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (user) {
      if (user.isEmailVerified) {
        throw new ApiError(
          Messages.EMAIL_ALREADY_VERIFIED,
          HttpStatus.CONFLICT
        );
      }
      const verificationToken = authService.generateVerificationToken(
        user._id.toString()
      );
      user.verificationToken = verificationToken;
      await user.save();
      await emailService.sendVerificationEmail(email, verificationToken);
    }

    res
      .status(HttpStatus.OK)
      .json({ message: Messages.VERIFICATION_EMAIL_RESENT });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!isValidEmail(email)) {
      throw new ApiError(Messages.INVALID_EMAIL, HttpStatus.BAD_REQUEST);
    }

    const user = await UserModel.findOne({ email });
    if (user && user.isEmailVerified) {
      const resetToken = authService.generateResetToken(user._id.toString());
      user.resetToken = resetToken;
      await user.save();
      await emailService.sendPasswordResetEmail(email, resetToken);
      res.status(HttpStatus.OK).json({ message: Messages.RESET_LINK_SENT });
      return;
    }

    throw new ApiError("Email not found or not verified", HttpStatus.NOT_FOUND);
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, password } = req.body;

    if (!isStrongPassword(password)) {
      throw new ApiError(Messages.WEAK_PASSWORD, HttpStatus.BAD_REQUEST);
    }

    const userId = authService.verifyResetToken(token);
    const user = await UserModel.findById(userId);
    if (user) {
      if (user.resetToken !== token) {
        throw new ApiError(Messages.INVALID_TOKEN, HttpStatus.UNAUTHORIZED);
      }
      const hashedPassword = await authService.hashPassword(password);
      user.password = hashedPassword;
      user.resetToken = undefined;
      await user.save();
      res
        .status(HttpStatus.OK)
        .json({ message: Messages.PASSWORD_RESET_SUCCESS });
      return;
    }

    throw new ApiError(Messages.INVALID_TOKEN, HttpStatus.UNAUTHORIZED);
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new ApiError(Messages.REFRESH_TOKEN_MISSING, HttpStatus.FORBIDDEN);
    }

    const decoded = authService.verifyRefreshToken(refreshToken);
    const { userId, role, sessionId } = decoded;

    const user = await UserModel.findById(userId).select("+sessions.tokenHash");
    if (!user || !sessionId) {
      throw new ApiError(Messages.INVALID_TOKEN, HttpStatus.UNAUTHORIZED);
    }

    const session = (user.sessions as any).id(sessionId);
    const tokenHash = authService.hashToken(refreshToken);
    if (!session || session.tokenHash !== tokenHash) {
      throw new ApiError(Messages.INVALID_TOKEN, HttpStatus.UNAUTHORIZED);
    }

    if (user.isBlocked) {
      throw new ApiError("User is blocked", HttpStatus.CONFLICT);
    }

    if (user.isDeleted) {
      throw new ApiError(
        "This account has been deactivated. Please contact your administrator.",
        HttpStatus.FORBIDDEN,
      );
    }

    const newAccessToken = authService.generateAccessToken(userId, role, sessionId);
    const newRefreshToken = authService.generateRefreshToken(userId, role, sessionId);

    session.tokenHash = authService.hashToken(newRefreshToken);
    session.lastUsedAt = new Date();

    await user.save();
    setTokensCookies(res, newAccessToken, newRefreshToken);

    res.status(HttpStatus.OK).json({ accessToken: newAccessToken });
  } catch (error) {
    clearAuthCookies(res);
    next(error);
  }
};

const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      try {
        const decoded = authService.verifyRefreshToken(refreshToken);
        if (decoded.sessionId) {
          await UserModel.updateOne(
            { _id: decoded.userId },
            { $pull: { sessions: { _id: decoded.sessionId } } }
          );
        }
      } catch (error) {
        // Token already invalid/expired: nothing to clean up server-side.
      }
    }

    clearAuthCookies(res);
    res.status(HttpStatus.OK).json({ message: Messages.LOGOUT_SUCCESS });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(Messages.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      throw new ApiError(
        "Current password, new password and confirmation are required",
        HttpStatus.BAD_REQUEST
      );
    }
    if (newPassword !== confirmNewPassword) {
      throw new ApiError(
        Messages.PASSWORDS_DO_NOT_MATCH,
        HttpStatus.BAD_REQUEST
      );
    }
    if (!isStrongPassword(newPassword)) {
      throw new ApiError(Messages.WEAK_PASSWORD, HttpStatus.BAD_REQUEST);
    }

    const user = await UserModel.findById(userId).select("+password");
    if (!user) {
      throw new ApiError("User not found", HttpStatus.NOT_FOUND);
    }

    const isCurrentValid = await authService.comparePassword(
      currentPassword,
      user.password!
    );
    if (!isCurrentValid) {
      throw new ApiError(
        Messages.CURRENT_PASSWORD_INCORRECT,
        HttpStatus.BAD_REQUEST
      );
    }

    const isSameAsOld = await authService.comparePassword(
      newPassword,
      user.password!
    );
    if (isSameAsOld) {
      throw new ApiError(
        "New password must be different from your current password",
        HttpStatus.BAD_REQUEST
      );
    }

    user.password = await authService.hashPassword(newPassword);

    const currentSessionId = req.user?.sessionId;
    user.sessions = user.sessions.filter(
      (session) => session._id.toString() === currentSessionId
    ) as any;

    await user.save();

    await ActivityLogModel.create({
      user: userId,
      action: "update",
      resource: "auth",
      resourceId: userId,
      details: "Password changed; other sessions logged out",
      ip: getRequestIp(req),
      userAgent: req.headers["user-agent"] as string | undefined,
    });

    try {
      await emailService.sendPasswordChangedEmail(user.email);
    } catch (error) {
      // Non-fatal: password change already succeeded.
    }

    res.status(HttpStatus.OK).json({ message: Messages.PASSWORD_CHANGED });
  } catch (error) {
    next(error);
  }
};

const getSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(Messages.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError("User not found", HttpStatus.NOT_FOUND);
    }

    const currentSessionId = req.user?.sessionId;
    const sessions = [...user.sessions]
      .sort(
        (a, b) =>
          new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
      )
      .map((session) => ({
        id: session._id.toString(),
        device: session.device,
        browser: session.browser,
        os: session.os,
        ip: session.ip,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        isCurrent: session._id.toString() === currentSessionId,
      }));

    res.status(HttpStatus.OK).json({ sessions });
  } catch (error) {
    next(error);
  }
};

const revokeSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(Messages.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }
    const { sessionId } = req.params;

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError("User not found", HttpStatus.NOT_FOUND);
    }

    const session = (user.sessions as any).id(sessionId);
    if (!session) {
      throw new ApiError(Messages.SESSION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const isRevokingCurrent = sessionId === req.user?.sessionId;
    session.deleteOne();
    await user.save();

    if (isRevokingCurrent) {
      clearAuthCookies(res);
    }

    res
      .status(HttpStatus.OK)
      .json({ message: Messages.SESSION_REVOKED, loggedOutCurrent: isRevokingCurrent });
  } catch (error) {
    next(error);
  }
};

const logoutOtherSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const currentSessionId = req.user?.sessionId;
    if (!userId) {
      throw new ApiError(Messages.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError("User not found", HttpStatus.NOT_FOUND);
    }

    user.sessions = user.sessions.filter(
      (session) => session._id.toString() === currentSessionId
    ) as any;
    await user.save();

    res
      .status(HttpStatus.OK)
      .json({ message: Messages.OTHER_SESSIONS_LOGGED_OUT });
  } catch (error) {
    next(error);
  }
};

const getLoginActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(Messages.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const logs = await ActivityLogModel.find({
      user: userId,
      action: "login",
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .select("ip userAgent device timestamp");

    res.status(HttpStatus.OK).json({
      logins: logs.map((log: any) => ({
        id: log._id.toString(),
        ip: log.ip || "unknown",
        userAgent: log.userAgent || "",
        device: log.device || "Unknown device",
        timestamp: log.timestamp,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export default {
  registerClient,
  login,
  googleLogin,
  validateEmail,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  changePassword,
  getSessions,
  revokeSession,
  logoutOtherSessions,
  getLoginActivity,
};