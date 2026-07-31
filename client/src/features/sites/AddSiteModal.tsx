import { useState } from "react";
import { MapPin, Building, Users, HardHat, AlertCircle, Check } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

interface AddSiteModalProps {
  onClose: () => void;
  onSubmit: (siteData: any) => Promise<void>;
  clients: { id: string; name: string }[];
  siteManagers: { id: string; name: string }[];
  architects: { id: string; name: string }[];
}

const fieldClass = (hasError?: boolean) =>
  cn(
    "w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100",
    hasError ? "border-danger-400" : "border-console-border",
  );

const AddSiteModal: React.FC<AddSiteModalProps> = ({
  onClose,
  onSubmit,
  clients,
  siteManagers,
  architects,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSite, setNewSite] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    budget: 0,
    status: "InProgress",
    clientId: "",
    siteManagerIds: [] as string[],
    architectIds: [] as string[],
  });
  const [inputErrors, setInputErrors] = useState({
    name: false,
    address: false,
    city: false,
    state: false,
    zip: false,
    clientId: false,
  });
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSite((prev) => ({ ...prev, [name]: value }));
    if (inputErrors[name as keyof typeof inputErrors]) {
      setInputErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewSite((prev) => ({ ...prev, [name]: value }));
    if (inputErrors[name as keyof typeof inputErrors]) {
      setInputErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, options } = e.target;
    const selectedValues = Array.from(options)
      .filter((option) => option.selected)
      .map((option) => option.value);
    setNewSite((prev) => ({ ...prev, [name]: selectedValues }));
  };

  const validateStep = (step: number) => {
    if (step === 0) {
      const newErrors = {
        name: !newSite.name.trim(),
        address: !newSite.address.trim(),
        city: !newSite.city.trim(),
        state: !newSite.state.trim(),
        zip: !newSite.zip.trim(),
      };
      setInputErrors((prev) => ({ ...prev, ...newErrors }));
      return !Object.values(newErrors).some(Boolean);
    }
    const newErrors = { clientId: !newSite.clientId };
    setInputErrors((prev) => ({ ...prev, ...newErrors }));
    return !Object.values(newErrors).some(Boolean);
  };

  const handleNext = () => {
    if (validateStep(activeStep)) setActiveStep(1);
  };

  const handleBack = () => setActiveStep(0);

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    setSubmissionError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(newSite);
    } catch (err) {
      setSubmissionError("Failed to create site. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={handleClose}
      disableClose={isSubmitting}
      closeOnOverlayClick={!isSubmitting}
      size="lg"
      title="Add New Site"
      description={activeStep === 0 ? "Enter site details" : "Project specifics & team members"}
      footer={
        <div className="flex w-full items-center justify-between">
          {activeStep === 0 ? (
            <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleBack} disabled={isSubmitting}>
              Back
            </Button>
          )}
          <Button onClick={activeStep === 0 ? handleNext : handleSubmit} loading={isSubmitting}>
            {activeStep === 0 ? "Continue" : "Create site"}
          </Button>
        </div>
      }
    >
      <div className="mb-6 flex items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 font-semibold text-white">
          {activeStep === 0 ? "1" : <Check size={16} />}
        </div>
        <div className={cn("mx-2 h-1 w-16", activeStep === 1 ? "bg-brand-700" : "bg-brand-200")} />
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full font-semibold",
            activeStep === 1 ? "bg-brand-700 text-white" : "bg-brand-100 text-brand-700",
          )}
        >
          2
        </div>
      </div>

      {submissionError && (
        <div className="mb-5 flex items-center gap-2 rounded-console border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
          <AlertCircle size={18} />
          {submissionError}
        </div>
      )}

      {activeStep === 0 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-console-text">
              <Building size={16} className="text-brand-600" /> Site name
            </label>
            <input
              type="text"
              name="name"
              value={newSite.name}
              onChange={handleInputChange}
              className={fieldClass(inputErrors.name)}
              placeholder="Enter site name"
            />
            {inputErrors.name && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
                <AlertCircle size={12} /> Site name is required
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-console-text">
              <MapPin size={16} className="text-brand-600" /> Address
            </label>
            <input
              type="text"
              name="address"
              value={newSite.address}
              onChange={handleInputChange}
              className={fieldClass(inputErrors.address)}
              placeholder="Street address"
            />
            {inputErrors.address && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
                <AlertCircle size={12} /> Address is required
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-console-text">City</label>
              <input
                type="text"
                name="city"
                value={newSite.city}
                onChange={handleInputChange}
                className={fieldClass(inputErrors.city)}
                placeholder="City"
              />
              {inputErrors.city && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
                  <AlertCircle size={12} /> Required
                </p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-console-text">State</label>
              <input
                type="text"
                name="state"
                value={newSite.state}
                onChange={handleInputChange}
                className={fieldClass(inputErrors.state)}
                placeholder="State"
              />
              {inputErrors.state && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
                  <AlertCircle size={12} /> Required
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-console-text">
              <MapPin size={16} className="text-brand-600" /> ZIP code
            </label>
            <input
              type="text"
              name="zip"
              value={newSite.zip}
              onChange={handleInputChange}
              className={fieldClass(inputErrors.zip)}
              placeholder="ZIP code"
            />
            {inputErrors.zip && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
                <AlertCircle size={12} /> ZIP code is required
              </p>
            )}
          </div>
        </div>
      )}

      {activeStep === 1 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-console-text">
              <Building size={16} className="text-brand-600" /> Client
            </label>
            <select
              name="clientId"
              value={newSite.clientId}
              onChange={handleSelectChange}
              className={fieldClass(inputErrors.clientId)}
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {inputErrors.clientId && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
                <AlertCircle size={12} /> Client selection is required
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-console-text">
              <Users size={16} className="text-brand-600" /> Site managers
            </label>
            <select
              multiple
              name="siteManagerIds"
              value={newSite.siteManagerIds}
              onChange={handleMultiSelectChange}
              className={cn(fieldClass(), "h-28")}
            >
              {siteManagers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-console-text">
              <HardHat size={16} className="text-brand-600" /> Architects
            </label>
            <select
              multiple
              name="architectIds"
              value={newSite.architectIds}
              onChange={handleMultiSelectChange}
              className={cn(fieldClass(), "h-28")}
            >
              {architects.map((architect) => (
                <option key={architect.id} value={architect.id}>
                  {architect.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">Project status</label>
            <Badge variant="warning">In Progress</Badge>
            <p className="mt-1.5 text-xs text-console-muted">
              New sites always start in progress. Status changes to completed once all phases
              are finished.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AddSiteModal;
