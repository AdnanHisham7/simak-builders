import React, { useState, useMemo, useEffect } from "react";
import { X, MapPin, AlertCircle, Search } from "lucide-react";

interface Contractor {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "active" | "blocked";
  siteAssignments: { site: { id: string; name: string }; balance: number }[];
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
  isAnimating?: boolean;
  sizeStyles?: string;
}

const ContractorAssignSiteModal: React.FC<ContractorAssignSiteModalProps> = ({
  isOpen,
  onClose,
  contractor,
  sites = [],
  onAssign,
  setError,
  isAnimating = false,
  sizeStyles = "max-w-2xl w-full mx-4",
}) => {
  // === ALL HOOKS ALWAYS RUN — NO EARLY RETURN BEFORE THEM ===
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelectedSiteId, setLocalSelectedSiteId] = useState("");

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setLocalSelectedSiteId("");
    }
  }, [isOpen]);

  // We compute these even if contractor is null (safe fallback)
  const assignedSiteIds =
    contractor?.siteAssignments.map((a) => a.site.id) || [];
  const availableSites = sites.filter(
    (site) => !assignedSiteIds.includes(site.id),
  );

  const filteredSites = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return availableSites;
    return availableSites.filter((site) =>
      site.name.toLowerCase().includes(query),
    );
  }, [availableSites, searchQuery]);

  const handleAssign = async () => {
    if (!localSelectedSiteId || !contractor) return;
    try {
      await onAssign(localSelectedSiteId);
      onClose();
    } catch (err) {
      setError?.("Failed to assign site.");
    }
  };

  const handleClose = () => {
    onClose();
  };

  // Now safe to early return
  if (!isOpen || !contractor) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-200 transform overflow-hidden ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        } ${sizeStyles}`}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-t-2xl" />

        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <MapPin size={24} className="mr-3 text-green-600" />
              Assign Site to {contractor.name}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative mb-6">
            <Search
              className="absolute left-3 top-3.5 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search sites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50"
            />
          </div>

          <label className="block text-gray-700 text-sm font-semibold mb-3">
            Select Available Site
          </label>

          <select
            value={localSelectedSiteId}
            onChange={(e) => setLocalSelectedSiteId(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition-all"
          >
            <option value="">Choose a site to assign...</option>
            {filteredSites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>

          {filteredSites.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
              {searchQuery.trim()
                ? "No matching sites found."
                : "No available sites remaining."}
            </div>
          )}

          <div className="flex justify-end gap-4 mt-8">
            <button
              onClick={handleClose}
              className="px-6 py-3 text-gray-700 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!localSelectedSiteId}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Assign Site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorAssignSiteModal;
