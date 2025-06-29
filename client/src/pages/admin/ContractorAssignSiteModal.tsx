import React, { useState } from "react";
import { X, MapPin, AlertCircle } from "lucide-react";
import { assignSiteToContractor } from "@/services/contractorService";

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
  setSelectedContractor: React.Dispatch<React.SetStateAction<Contractor | null>>;
  setIsAssignSiteModalOpen: (open: boolean) => void;
  setError: (error: string | null) => void;
  isAnimating: boolean;
  sizeStyles: string;
}

const ContractorAssignSiteModal: React.FC<ContractorAssignSiteModalProps> = ({
  isOpen,
  onClose,
  contractor,
  sites,
  onAssign,
  setSelectedContractor,
  setIsAssignSiteModalOpen,
  setError,
  isAnimating,
  sizeStyles,
}) => {
  if (!isOpen || !contractor) return null;
  const assignedSiteIds = contractor.siteAssignments.map(
    (assignment) => assignment.site.id
  );
  const availableSites = sites.filter(
    (site) => !assignedSiteIds.includes(site.id)
  );
  const [localSelectedSiteId, setLocalSelectedSiteId] = useState("");

  const handleAssign = async () => {
    if (!localSelectedSiteId) return;
    try {
      await assignSiteToContractor(
        contractor.id,
        localSelectedSiteId
      );
      const newAssignment = {
        site: {
          id: localSelectedSiteId,
          name:
            availableSites.find((s) => s.id === localSelectedSiteId)?.name ||
            "",
        },
        balance: 0,
      };
      setSelectedContractor((prev) => ({
        ...prev!,
        siteAssignments: [...prev!.siteAssignments, newAssignment],
      }));
      setIsAssignSiteModalOpen(false);
    } catch (err) {
      setError("Failed to assign site.");
    }
  };

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
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-semibold mb-3">
              Select Available Site
            </label>
            <select
              value={localSelectedSiteId}
              onChange={(e) => setLocalSelectedSiteId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition-all duration-200"
            >
              <option value="">Choose a site to assign</option>
              {availableSites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          {availableSites.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-yellow-800 flex items-center">
                <AlertCircle size={16} className="mr-2" />
                All available sites have been assigned to this contractor.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!localSelectedSiteId || availableSites.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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