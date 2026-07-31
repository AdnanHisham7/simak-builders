import { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface Contractor {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "active" | "blocked";
  siteAssignments: { site: { id: string; name: string } }[];
}

interface Site {
  id: string;
  name: string;
}

interface ContractorAssignSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractor: Contractor | null;
  sites: Site[];
  onAssign: (siteId: string) => void;
  setError?: (error: string | null) => void;
  sizeStyles?: string;
}

const ContractorAssignSiteModal: React.FC<ContractorAssignSiteModalProps> = ({
  isOpen,
  onClose,
  contractor,
  sites = [],
  onAssign,
  setError,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelectedSiteId, setLocalSelectedSiteId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setLocalSelectedSiteId("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const assignedSiteIds = contractor?.siteAssignments.map((a) => a.site.id) || [];
  const availableSites = sites.filter((site) => !assignedSiteIds.includes(site.id));

  const filteredSites = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return availableSites;
    return availableSites.filter((site) => site.name.toLowerCase().includes(query));
  }, [availableSites, searchQuery]);

  const handleAssign = async () => {
    if (!localSelectedSiteId || !contractor || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAssign(localSelectedSiteId);
      onClose();
    } catch (err) {
      setError?.("Failed to assign site.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!contractor) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      disableClose={isSubmitting}
      closeOnOverlayClick={!isSubmitting}
      title={`Assign Site to ${contractor.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!localSelectedSiteId}
            loading={isSubmitting}
          >
            Assign site
          </Button>
        </>
      }
    >
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted" size={16} />
        <input
          type="text"
          placeholder="Search sites..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-console-border py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <label className="mb-1.5 block text-sm font-medium text-console-text">
        Select available site
      </label>
      <select
        value={localSelectedSiteId}
        onChange={(e) => setLocalSelectedSiteId(e.target.value)}
        className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      >
        <option value="">Choose a site to assign...</option>
        {filteredSites.map((site) => (
          <option key={site.id} value={site.id}>
            {site.name}
          </option>
        ))}
      </select>

      {filteredSites.length === 0 && (
        <div className="mt-4 rounded-console border border-warning-100 bg-warning-50 p-4 text-sm text-warning-800">
          {searchQuery.trim() ? "No matching sites found." : "No available sites remaining."}
        </div>
      )}
    </Modal>
  );
};

export default ContractorAssignSiteModal;
