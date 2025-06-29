import { motion } from "framer-motion";
import {
  LockClosedIcon,
} from "@heroicons/react/24/solid";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type ResetPasswordFormProps = {
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

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
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
    {/* New Password */}
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        New Password
      </label>
      <Input
        type={showPassword ? "text" : "password"}
        name="password"
        placeholder="Enter your new password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
        showToggle
      />
    </div>

    {/* Confirm New Password */}
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        Confirm New Password
      </label>
      <Input
        type={showConfirmPassword ? "text" : "password"}
        name="confirmPassword"
        placeholder="Confirm your new password"
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
      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
    >
      {isLoading ? "Resetting..." : "Reset Password"}
    </Button>
  </motion.div>
);

export default ResetPasswordForm;
