import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { changePassword } from "@/services/authService";

const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};:"\\|,.<>\/?]).{8,64}$/;

const ChangePasswordCard: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }
    if (!PASSWORD_PATTERN.test(newPassword)) {
      toast.error(
        "New password must be 8+ characters and include upper case, lower case, a number, and a symbol",
      );
      return;
    }
    if (newPassword === currentPassword) {
      toast.error("New password must be different from your current password");
      return;
    }

    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword, confirmNewPassword });
      toast.success(
        "Password changed successfully. You've been logged out of other devices.",
      );
      resetForm();
    } catch (err: any) {
      toast.error(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to change password",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <KeyRound size={16} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-console-text">Change password</h3>
          <p className="text-xs text-console-muted">
            Changing your password logs you out of all other active sessions.
          </p>
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">
            Current password
          </label>
          <Input
            type="password"
            name="currentPassword"
            placeholder="Enter your current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            showToggle
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">
            New password
          </label>
          <Input
            type="password"
            name="newPassword"
            placeholder="Enter a new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            showToggle
          />
          <p className="mt-1.5 text-xs text-console-muted">
            8+ characters, with upper case, lower case, a number, and a symbol.
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">
            Confirm new password
          </label>
          <Input
            type="password"
            name="confirmNewPassword"
            placeholder="Re-enter your new password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            showToggle
          />
        </div>
        <Button onClick={handleSubmit} loading={saving} disabled={saving}>
          Update password
        </Button>
      </div>
    </Card>
  );
};

export default ChangePasswordCard;
