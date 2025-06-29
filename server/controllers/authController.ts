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

    const accessToken = authService.generateAccessToken(
      user._id.toString(),
      user.role
    );
    const refreshToken = authService.generateRefreshToken(
      user._id.toString(),
      user.role
    );
    user.refreshToken = refreshToken;

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

    const accessToken = authService.generateAccessToken(
      user._id.toString(),
      user.role
    );
    const refreshToken = authService.generateRefreshToken(
      user._id.toString(),
      user.role
    );
    user.refreshToken = refreshToken;
    await user.save();
    setTokensCookies(res, accessToken, refreshToken);

    res
      .status(HttpStatus.OK)
      .json({ user: { id: user._id, email: user.email, name: user.name } });
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
    const { userId, role } = decoded;

    const user = await UserModel.findById(userId);
    if (!user || user.refreshToken !== refreshToken) {
      throw new ApiError(Messages.INVALID_TOKEN, HttpStatus.UNAUTHORIZED);
    }

    if (user.isBlocked) {
      throw new ApiError("User is blocked", HttpStatus.CONFLICT);
    }

    const accessToken = authService.generateAccessToken(userId, role);
    const newRefreshToken = authService.generateRefreshToken(userId, role);
    user.refreshToken = newRefreshToken;
    await user.save();
    setTokensCookies(res, accessToken, newRefreshToken);

    res.status(HttpStatus.OK).json({ accessToken });
  } catch (error) {
    clearAuthCookies(res);
    next(error);
  }
};

const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    clearAuthCookies(res);
    res.status(HttpStatus.OK).json({ message: Messages.LOGOUT_SUCCESS });
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
};
