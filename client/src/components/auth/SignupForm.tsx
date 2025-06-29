import { motion } from "framer-motion";
import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/solid";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type SignupFormProps = {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (value: boolean) => void;
  isLoading: boolean;
  handleSubmit: () => void;
};

const SignupForm: React.FC<SignupFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  showConfirmPassword,
  isLoading,
  handleSubmit,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    {/* Email */}
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

    {/* Password */}
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">Password</label>
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

    {/* Confirm Password */}
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
      <Input
        type={showConfirmPassword ? "text" : "password"}
        name="confirmPassword"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
        showToggle
      />
    </div>

    {/* Submit Button */}
    <Button
      type="button"
      loading={isLoading}
      disabled={isLoading}
      onClick={handleSubmit}
      className="w-full py-3 px-4 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg"
    >
      {isLoading ? "Signing Up..." : "Sign Up"}
    </Button>
  </motion.div>
);

export default SignupForm;
