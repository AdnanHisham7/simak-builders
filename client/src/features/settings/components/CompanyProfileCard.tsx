import { useEffect, useRef, useState } from "react";
import { Building2, Camera } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import {
  CompanyProfile,
  getCompanyProfile,
  updateCompanyProfile,
} from "@/services/companyService";
import { invalidateCompanyProfileCache } from "@/hooks/useCompanyProfile";

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

const emptyProfile: Omit<CompanyProfile, "id" | "logo"> = {
  name: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  phone: "",
  email: "",
  website: "",
  taxId: "",
  description: "",
};

const CompanyProfileCard: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyProfile);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getCompanyProfile();
        if (!isMounted) return;
        const { id, logo, ...rest } = data;
        setForm({ ...emptyProfile, ...rest });
        setLogoUrl(logo);
        invalidateCompanyProfileCache(data);
      } catch (err) {
        if (isMounted) toast.error("Failed to load company profile");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [logoFile]);

  const handleFieldChange =
    (field: keyof typeof emptyProfile) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      toast.error("Please select a JPEG, PNG, WEBP, or SVG image");
      return;
    }
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      toast.error("Logo must be smaller than 5MB");
      return;
    }
    setLogoFile(file);
  };

  const handleSave = async () => {
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      toast.error("Please enter a valid company email address");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateCompanyProfile({
        ...form,
        ...(logoFile ? { logo: logoFile } : {}),
      });
      setForm({
        name: updated.name,
        address: updated.address,
        city: updated.city,
        state: updated.state,
        zip: updated.zip,
        country: updated.country,
        phone: updated.phone,
        email: updated.email,
        website: updated.website,
        taxId: updated.taxId,
        description: updated.description,
      });
      setLogoUrl(updated.logo);
      setLogoFile(null);
      invalidateCompanyProfileCache(updated);
      toast.success("Company profile updated");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update company profile");
    } finally {
      setSaving(false);
    }
  };

  const displayLogo = logoPreview || logoUrl;

  if (loading) {
    return (
      <Card>
        <div className="space-y-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Building2 size={16} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-console-text">Company profile</h3>
          <p className="text-xs text-console-muted">
            Visible across the dashboard and used for company branding.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-console-border pb-6">
        <div className="relative shrink-0">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-console-bg text-console-muted">
            {displayLogo ? (
              <img src={displayLogo} alt="Company logo" className="h-full w-full object-cover" />
            ) : (
              <Building2 size={24} />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-console-surface bg-brand-700 text-white hover:bg-brand-800"
            aria-label="Change company logo"
          >
            <Camera size={13} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleLogoSelect}
          />
        </div>
        <div className="text-sm text-console-muted">
          {logoFile ? (
            <span className="text-brand-700">New logo selected — save to apply</span>
          ) : (
            "Upload a square logo (JPEG, PNG, WEBP, or SVG, up to 5MB)."
          )}
        </div>
      </div>

      <div className="mt-6 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-console-text">
            Company name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={handleFieldChange("name")}
            placeholder="Enter company name"
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-console-text">Address</label>
          <input
            type="text"
            value={form.address}
            onChange={handleFieldChange("address")}
            placeholder="Street address"
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">City</label>
          <input
            type="text"
            value={form.city}
            onChange={handleFieldChange("city")}
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">State</label>
          <input
            type="text"
            value={form.state}
            onChange={handleFieldChange("state")}
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">ZIP / PIN</label>
          <input
            type="text"
            value={form.zip}
            onChange={handleFieldChange("zip")}
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">Country</label>
          <input
            type="text"
            value={form.country}
            onChange={handleFieldChange("country")}
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={handleFieldChange("phone")}
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={handleFieldChange("email")}
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">Website</label>
          <input
            type="text"
            value={form.website}
            onChange={handleFieldChange("website")}
            placeholder="https://"
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">Tax / GST ID</label>
          <input
            type="text"
            value={form.taxId}
            onChange={handleFieldChange("taxId")}
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-console-text">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={handleFieldChange("description")}
            rows={3}
            maxLength={500}
            placeholder="A short description of your company"
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      <div className="mt-6">
        <Button onClick={handleSave} loading={saving} disabled={saving}>
          Save changes
        </Button>
      </div>
    </Card>
  );
};

export default CompanyProfileCard;
