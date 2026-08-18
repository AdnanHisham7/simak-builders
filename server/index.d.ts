import { UserRole } from "@entities/user";
import { HydratedDocument } from "mongoose";
import { User } from "@entities/user";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
        sessionId?: string;
      };
      /**
       * Populated by authMiddleware after it verifies the JWT and loads the
       * user from the database to check isBlocked/isDeleted/sessions.
       * Controllers behind authMiddleware should read from this instead of
       * issuing a second UserModel.findById(req.user.userId) call.
       */
      authUser?: HydratedDocument<User>;
    }
  }
}