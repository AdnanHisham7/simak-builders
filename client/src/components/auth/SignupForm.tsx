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
      <label className="block text-sm font-medium text-console-text">Password</label>
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

    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-console-text">Confirm password</label>
      <Input
        type="password"
        name="confirmPassword"
        placeholder="Confirm your password"
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
      {isLoading ? "Signing up..." : "Sign up"}
    </Button>
  </motion.div>
);

export default SignupForm;
