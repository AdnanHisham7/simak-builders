import Joi from 'joi';

// Schema for registering a client
export const registerClientSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
});

// Schema for logging in
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Schema for Google login
export const googleLoginSchema = Joi.object({
  credential: Joi.string().required(),
});

// Schema for verifying email (query parameter)
export const verifyEmailSchema = Joi.object({
  token: Joi.string().required(),
});

// Schema for validate email
export const validateEmailSchema = Joi.object({
  email: Joi.string().required(),
});

// Schema for resending verification email
export const resendVerificationEmailSchema = Joi.object({
  email: Joi.string().email().required(),
});

// Schema for forgot password
export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

// Schema for resetting password
export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required(),
});

// Schema for registering a company
export const registerCompanySchema = Joi.object({
  name: Joi.string().min(1).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  phone: Joi.string().min(1).required(),
  address: Joi.string().min(1).required(),
  city: Joi.string().min(1).required(),
  state: Joi.string().min(1).required(),
  zip: Joi.string().min(1).required(),
  description: Joi.string().optional(),
  website: Joi.string().uri().optional(),
});