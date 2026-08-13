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
  isLoading,
  handleSubmit,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    className="space-y-6"
  >
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-console-text">
        New password
      </label>
      <Input
        type="password"
        name="password"
        placeholder="Enter your new password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        icon={<LockClosedIcon className="h-5 w-5" />}
        showToggle
      />
    </div>

    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-console-text">
        Confirm new password
      </label>
      <Input
        type="password"
        name="confirmPassword"
        placeholder="Confirm your new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        icon={<LockClosedIcon className="h-5 w-5" />}
        showToggle
      />
    </div>

    <Button
      type="button"
      loading={isLoading}
      disabled={isLoading}
      onClick={handleSubmit}
      className="w-full"
      size="lg"
    >
      {isLoading ? "Resetting..." : "Reset password"}
    </Button>
  </motion.div>
);

export default ResetPasswordForm;
