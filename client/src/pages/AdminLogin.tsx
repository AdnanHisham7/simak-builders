import { useState, useEffect } from "react";
import { Lock, Mail, AlertCircle, ShieldCheck } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { setUser } from "@/store/slices/authSlice";
import { login } from "@/services/authService";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { getLandingPagePath } from "@/constants/landingPages";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user?.isAdmin) {
      navigate("/admin/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await login(email, password);
      dispatch(setUser({ user: data.user, userType: "admin" }));
      if (data.user.isAdmin) {
        navigate(
          getLandingPagePath("admin", data.user.preferences?.defaultLandingPage),
        );
      } else {
        setError("You do not have admin privileges.");
      }
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="glass-panel w-full max-w-md rounded-glass p-8 shadow-glass-lg sm:p-10"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold text-console-text">Admin portal</h1>
          <p className="mt-2 text-sm text-console-muted">
            Sign in to access the admin dashboard
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-console-text">
              Email address
            </label>
            <Input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-5 w-5" />}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-console-text">
              Password
            </label>
            <Input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="h-5 w-5" />}
              showToggle
            />
          </div>

          <div className="flex items-center justify-end text-sm">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="font-medium text-brand-700 transition-colors hover:text-brand-800 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="button"
            onClick={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </div>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-console-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-console-muted">Need help?</span>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-console-muted">
            Contact your system administrator for support
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
