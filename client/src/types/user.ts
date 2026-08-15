export interface IUser {
  id: string;
  name: string;
  email: string;
  userType: string;
  resetToken?: string;
  profileImage?: string;
  phone?: string;
  savedCompanies?: string[];
  isEmailVerified: boolean;
  verificationToken?: string;
  googleId?: string;
  isBlocked?: boolean;
  isAdmin: boolean;
  preferences?: {
    defaultLandingPage?: string;
    dateFormat?: string;
    numberFormat?: string;
    timezone?: string;
  };
}

export enum UserRole {
  CompanyAdmin = "admin",
  SiteManager = "siteManager",
  Supervisor = "supervisor",
  Architect = "architect",
  Client = "client",
  Employee = "employee",
}
