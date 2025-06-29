import {
  EnvelopeIcon,
  LockClosedIcon,
} from "@heroicons/react/24/solid";
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
  showPassword,
  isLoading,
  handleSubmit,
  isEmailNotVerified,
  handleResendVerification,
  resendVerificationLoading,
  navigate,
}) => (
  <div className="space-y-6">
    {/* Email Input */}
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">Email</label>
      <Input
        type="email"
        name="email"
        placeholder="Enter your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
      />
    </div>

    {/* Password Input */}
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          Password
        </label>
        {navigate && (
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-xs text-yellow-600 hover:text-yellow-800 hover:underline transition-colors"
          >
            Forgot password?
          </button>
        )}
      </div>
      <Input
        type={showPassword ? "text" : "password"}
        name="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
        showToggle
      />
    </div>

    {/* Email Not Verified Alert */}
    {isEmailNotVerified && handleResendVerification && (
      <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
        <p className="text-sm">Your email is not verified.</p>
        <button
          type="button"
          onClick={handleResendVerification}
          disabled={resendVerificationLoading}
          className="mt-2 text-sm text-yellow-600 hover:text-yellow-800 font-medium flex items-center gap-2"
        >
          {resendVerificationLoading && <Spinner className="w-4 h-4" />}
          Send Verification Email
        </button>
      </div>
    )}

    {/* Submit Button */}
    <Button
      type="button"
      loading={isLoading}
      disabled={isLoading}
      onClick={handleSubmit}
      className="w-full py-3 px-4 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg"
    >
      {isLoading ? "Signing In..." : "Sign In"}
    </Button>
  </div>
);

export default LoginForm;
