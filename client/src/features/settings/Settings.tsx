import { useState } from "react";
import { Building2, Info } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const Settings: React.FC = () => {
  const [companyName, setCompanyName] = useState("");

  const handleSave = () => {
    toast.info("Company settings management isn't connected yet — check back soon.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-console-text">Settings</h1>
        <p className="mt-0.5 text-sm text-console-muted">Manage your company preferences</p>
      </div>

      <Card>
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <Building2 size={16} />
          </div>
          <h3 className="text-base font-semibold text-console-text">Company profile</h3>
        </div>

        <div className="mb-5 flex items-start gap-2.5 rounded-console border border-info-100 bg-info-50 p-4 text-sm text-info-800">
          <Info size={16} className="mt-0.5 shrink-0" />
          <p>This section isn't connected to a backend yet, so changes here won't be saved.</p>
        </div>

        <div className="max-w-md space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">Company name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter company name"
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <Button onClick={handleSave}>Save changes</Button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
