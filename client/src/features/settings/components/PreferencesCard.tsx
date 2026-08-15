import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { UserPreferences, updateOwnPreferences } from "@/services/userService";
import {
  LANDING_PAGE_OPTIONS_BY_ROLE,
  DEFAULT_LANDING_PAGE_BY_ROLE,
} from "@/constants/landingPages";

const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/01/2026)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (01/31/2026)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2026-01-31)" },
];

const NUMBER_FORMATS = [
  { value: "en-IN", label: "Indian (1,23,456.78)" },
  { value: "en-US", label: "US (123,456.78)" },
  { value: "en-GB", label: "UK (123,456.78)" },
];

const COMMON_TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

interface PreferencesCardProps {
  role: string;
  preferences: UserPreferences;
  onChange: (preferences: UserPreferences) => void;
}

const PreferencesCard: React.FC<PreferencesCardProps> = ({
  role,
  preferences,
  onChange,
}) => {
  const [defaultLandingPage, setDefaultLandingPage] = useState(
    preferences.defaultLandingPage || DEFAULT_LANDING_PAGE_BY_ROLE[role] || "dashboard",
  );
  const [dateFormat, setDateFormat] = useState(preferences.dateFormat || "DD/MM/YYYY");
  const [numberFormat, setNumberFormat] = useState(preferences.numberFormat || "en-IN");
  const [timezone, setTimezone] = useState(preferences.timezone || "Asia/Kolkata");
  const [saving, setSaving] = useState(false);

  const landingPageOptions = LANDING_PAGE_OPTIONS_BY_ROLE[role] || [];

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateOwnPreferences({
        defaultLandingPage,
        dateFormat,
        numberFormat,
        timezone,
      });
      onChange(updated);
      toast.success("Preferences saved");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <SlidersHorizontal size={16} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-console-text">Preferences</h3>
          <p className="text-xs text-console-muted">
            Personalize how the app behaves and displays for you.
          </p>
        </div>
      </div>

      <div className="max-w-md space-y-4">
        {landingPageOptions.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">
              Default landing page after login
            </label>
            <select
              value={defaultLandingPage}
              onChange={(e) => setDefaultLandingPage(e.target.value)}
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              {landingPageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">
            Date format
          </label>
          <select
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {DATE_FORMATS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">
            Number format
          </label>
          <select
            value={numberFormat}
            onChange={(e) => setNumberFormat(e.target.value)}
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {NUMBER_FORMATS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <Button onClick={handleSave} loading={saving} disabled={saving}>
          Save preferences
        </Button>
      </div>
    </Card>
  );
};

export default PreferencesCard;
