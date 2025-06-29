export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
  
    constructor(message: string, statusCode: number, isOperational = true) {
      super(message);
      Object.setPrototypeOf(this, new.target.prototype);
      this.statusCode = statusCode;
      this.isOperational = isOperational;
      Error.captureStackTrace(this);
    }
  }