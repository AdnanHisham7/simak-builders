import { useState } from "react";
import { Building, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import Badge from "@/components/ui/Badge";
import { Site } from "@/services/siteService";

interface SitePickerModalProps {
  isOpen: boolean;
  sites: Site[];
  loading: boolean;
  convertedSiteIds: Set<string>;
  onClose: () => void;
  onSelect: (site: Site) => void;
}

const SitePickerModal: React.FC<SitePickerModalProps> = ({
  isOpen,
  sites,
  loading,
  convertedSiteIds,
  onClose,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSites = sites.filter((site) =>
    `${site.name} ${site.city} ${site.state}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select a site to convert"
      description="Choose a site to turn into a client-facing portfolio project."
      size="md"
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-console-muted" />
          <input
            type="text"
            placeholder="Search sites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-console-border py-2.5 pl-9 pr-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filteredSites.length === 0 ? (
          <p className="py-8 text-center text-sm text-console-muted">No sites found.</p>
        ) : (
          <div className="max-h-96 space-y-1.5 overflow-y-auto">
            {filteredSites.map((site) => {
              const alreadyConverted = convertedSiteIds.has(site.id);
              return (
                <button
                  key={site.id}
                  type="button"
                  disabled={alreadyConverted}
                  onClick={() => onSelect(site)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-console-border px-3.5 py-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-console-border disabled:hover:bg-transparent"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-console-bg text-console-muted">
                      <Building size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-console-text">{site.name}</p>
                      <p className="text-xs text-console-muted">
                        {site.city}, {site.state}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={site.status === "Completed" ? "success" : "warning"}>
                      {site.status}
                    </Badge>
                    {alreadyConverted && <Badge variant="neutral">Already converted</Badge>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SitePickerModal;
