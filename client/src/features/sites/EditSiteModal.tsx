import { useEffect, useState } from "react";
import { AlertCircle, Building, MapPin } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export interface EditSiteFormValues {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface EditSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: EditSiteFormValues;
  onSubmit: (updatedSite: EditSiteFormValues) => Promise<void>;
}

type FieldName = keyof EditSiteFormValues;

const FIELD_LABELS: Record<FieldName, string> = {
  name: "Site name",
  address: "Address",
  city: "City",
  state: "State",
  zip: "ZIP code",
};

const EMPTY_ERRORS: Record<FieldName, boolean> = {
  name: false,
  address: false,
  city: false,
  state: false,
  zip: false,
};

const fieldClass = (hasError?: boolean) =>
  cn(
    "w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
    hasError
      ? "border-danger-400 focus:ring-danger-100"
      : "border-console-border focus:border-brand-500 focus:ring-brand-100",
  );

const EditSiteModal: React.FC<EditSiteModalProps> = ({
  isOpen,
  onClose,
  site,
  onSubmit,
}) => {
  const [formValues, setFormValues] = useState<EditSiteFormValues>(site);
  const [inputErrors, setInputErrors] =
    useState<Record<FieldName, boolean>>(EMPTY_ERRORS);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormValues(site);
      setInputErrors(EMPTY_ERRORS);
      setSubmissionError(null);
    }
  }, [isOpen, site]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as FieldName;
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
    if (inputErrors[fieldName]) {
      setInputErrors((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  const validate = (): boolean => {
    const errors: Record<FieldName, boolean> = {
      name: !formValues.name.trim(),
      address: !formValues.address.trim(),
      city: !formValues.city.trim(),
      state: !formValues.state.trim(),
      zip: !formValues.zip.trim(),
    };
    setInputErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    setSubmissionError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formValues.name.trim(),
        address: formValues.address.trim(),
        city: formValues.city.trim(),
        state: formValues.state.trim(),
        zip: formValues.zip.trim(),
      });
    } catch {
      setSubmissionError("Failed to update site. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      disableClose={isSubmitting}
      closeOnOverlayClick={!isSubmitting}
      title="Edit Site"
      description="Update the site's name and address details"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {submissionError && (
          <div className="flex items-center gap-2 rounded-console border border-danger-100 bg-danger-50 p-4 text-sm text-danger-700">
            <AlertCircle size={18} />
            {submissionError}
          </div>
        )}

        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-console-text">
            <Building size={16} className="text-brand-600" />{" "}
            {FIELD_LABELS.name}
          </label>
          <input
            type="text"
            name="name"
            value={formValues.name}
            onChange={handleInputChange}
            disabled={isSubmitting}
            placeholder="Enter site name"
            className={fieldClass(inputErrors.name)}
          />
          {inputErrors.name && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
              <AlertCircle size={12} /> Site name is required
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-console-text">
            <MapPin size={16} className="text-brand-600" />{" "}
            {FIELD_LABELS.address}
          </label>
          <input
            type="text"
            name="address"
            value={formValues.address}
            onChange={handleInputChange}
            disabled={isSubmitting}
            placeholder="Street address"
            className={fieldClass(inputErrors.address)}
          />
          {inputErrors.address && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
              <AlertCircle size={12} /> Address is required
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">
              {FIELD_LABELS.city}
            </label>
            <input
              type="text"
              name="city"
              value={formValues.city}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="City"
              className={fieldClass(inputErrors.city)}
            />
            {inputErrors.city && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
                <AlertCircle size={12} /> Required
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">
              {FIELD_LABELS.state}
            </label>
            <input
              type="text"
              name="state"
              value={formValues.state}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="State"
              className={fieldClass(inputErrors.state)}
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
            <MapPin size={16} className="text-brand-600" /> {FIELD_LABELS.zip}
          </label>
          <input
            type="text"
            name="zip"
            value={formValues.zip}
            onChange={handleInputChange}
            disabled={isSubmitting}
            placeholder="ZIP code"
            className={fieldClass(inputErrors.zip)}
          />
          {inputErrors.zip && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
              <AlertCircle size={12} /> ZIP code is required
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditSiteModal;
