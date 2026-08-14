import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { Camera, Mail, ShieldCheck, User as UserIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { RootState } from "@/store/store";
import { updateUserFields } from "@/store/slices/authSlice";
import { getCurrentUser, updateOwnProfile } from "@/services/userService";

const ROLE_LABELS: Record<string, string> = {
  admin: "Company Admin",
  siteManager: "Site Manager",
  supervisor: "Supervisor",
  architect: "Architect",
  client: "Client",
  employee: "Employee",
};

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const { user, userType } = useSelector((state: RootState) => state.auth);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const data = await getCurrentUser();
        if (!isMounted) return;
        setName(data.name || "");
        setPhone(data.phone || "");
        setEmail(data.email || "");
        setRole(data.role || userType || "");
        setAvatarUrl(data.profileImage);
      } catch (err) {
        toast.error("Failed to load profile");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [userType]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error("Please select a JPEG, PNG, or WEBP image");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    setAvatarFile(file);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Name cannot be empty");
      return;
    }
    if (trimmedName.length > 100) {
      toast.error("Name cannot exceed 100 characters");
      return;
    }
    if (phone.trim().length > 20) {
      toast.error("Phone number cannot exceed 20 characters");
      return;
    }

    setSaving(true);
    try {
      const payload: { name?: string; phone?: string; profileImage?: File } = {
        name: trimmedName,
        phone: phone.trim(),
      };
      if (avatarFile) payload.profileImage = avatarFile;

      const data = await updateOwnProfile(payload);
      const updatedUser = data.user || {};

      setName(updatedUser.name ?? trimmedName);
      setPhone(updatedUser.phone ?? phone.trim());
      setAvatarUrl(updatedUser.profileImage ?? avatarUrl);
      setAvatarFile(null);

      dispatch(
        updateUserFields({
          name: updatedUser.name ?? trimmedName,
          profileImage: updatedUser.profileImage ?? avatarUrl,
        }),
      );

      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const displayAvatar = avatarPreview || avatarUrl;
  const initials = (name || user?.name || "?")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-console-muted">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-console-text">My Profile</h1>
        <p className="mt-0.5 text-sm text-console-muted">
          Manage your personal information
        </p>
      </div>

      <Card>
        <div className="flex flex-col items-center gap-4 border-b border-console-border pb-6 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-console-surface bg-brand-700 text-white hover:bg-brand-800"
              aria-label="Change profile photo"
            >
              <Camera size={13} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarSelect}
            />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-base font-semibold text-console-text">
              {name || "Unnamed user"}
            </p>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-sm text-console-muted sm:justify-start">
              <ShieldCheck size={14} />
              <span>{ROLE_LABELS[role] || role || "User"}</span>
            </div>
            {avatarFile && (
              <p className="mt-1 text-xs text-brand-700">
                New photo selected — save to apply
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-console-text">
              <UserIcon size={14} />
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="Enter your full name"
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">
              Phone number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={20}
              placeholder="Enter your phone number"
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-console-text">
              <Mail size={14} />
              Email address
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full cursor-not-allowed rounded-lg border border-console-border bg-console-bg px-3.5 py-2.5 text-sm text-console-muted"
            />
            <p className="mt-1.5 text-xs text-console-muted">
              Contact your administrator to change your email address.
            </p>
          </div>

          <div className="pt-2">
            <Button onClick={handleSave} loading={saving} disabled={saving}>
              Save changes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;