import {
  EnvelopeIcon,
  LockClosedIcon,
} from "@heroicons/react/24/solid";
import { AlertCircle } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Spinner from "../ui/Spinner";

type LoginFormProps = {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  isLoading: boolean;
  handleSubmit: () => void;
  isEmailNotVerified?: boolean;
  handleResendVerification?: () => void;
  resendVerificationLoading?: boolean;
  navigate?: (path: string) => void;
};

const LoginForm: React.FC<LoginFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  isLoading,
  handleSubmit,
  isEmailNotVerified,
  handleResendVerification,
  resendVerificationLoading,
  navigate,
}) => (
  <div className="space-y-6">
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-console-text">Email</label>
      <Input
        type="email"
        name="email"
        placeholder="Enter your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={<EnvelopeIcon className="h-5 w-5" />}
      />
    </div>

    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-console-text">
          Password
        </label>
        {navigate && (
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-xs font-medium text-brand-700 transition-colors hover:text-brand-800 hover:underline"
          >
            Forgot password?
          </button>
        )}
      </div>
      <Input
        type="password"
        name="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={<LockClosedIcon className="h-5 w-5" />}
        showToggle
      />
    </div>

    {isEmailNotVerified && handleResendVerification && (
      <div className="flex items-start gap-2.5 rounded-lg border border-warning-200 bg-warning-50 p-4 text-warning-800">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="text-sm">Your email is not verified.</p>
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resendVerificationLoading}
            className="mt-2 flex items-center gap-2 text-sm font-medium text-warning-700 transition-colors hover:text-warning-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resendVerificationLoading && <Spinner className="h-4 w-4" />}
            Send verification email
          </button>
        </div>
      </div>
    )}

    <Button
      type="button"
      loading={isLoading}
      disabled={isLoading}
      onClick={handleSubmit}
      className="w-full"
      size="lg"
    >
      {isLoading ? "Signing in..." : "Sign in"}
    </Button>
  </div>
);

export default LoginForm;
