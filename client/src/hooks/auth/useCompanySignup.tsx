import { useState } from "react";
import { signupCompany, resendVerificationEmail } from "@/services/authService";
import { toast } from "sonner";

export const useCompanySignup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleCompanySignup = async (companyData: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone: string;
    website?: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    description: string;
  }) => {
    const {
      name,
      email,
      password,
      confirmPassword,
      phone,
      address,
      city,
      state,
      zip,
      description,
    } = companyData;

    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !zip ||
      !description
    ) {
      toast.warning("All fields are required!");
      return;
    }

    if (password !== confirmPassword) {
      toast.warning("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signupCompany(companyData);
      if (result.resend) {
        await resendVerificationEmail(email);
        setIsEmailSent(true);
        toast.success(
          "Verification email has been sent to your email address."
        );
      } else {
        setIsEmailSent(true);
        toast.success(
          "Company signup successful! Please check your email to verify."
        );
      }
    } catch (error: unknown) {
      console.error("Company signup failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleCompanySignup,
    isEmailSent,
  };
};
