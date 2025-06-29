import React, { useState } from "react";
import {
  X,
  Users,
  Mail,
  Phone,
  Building2,
  MapPin,
  Plus,
  Activity,
  DollarSign,
} from "lucide-react";
import { getContractorTransactions } from "@/services/contractorService";
import AddTransactionModal from "./AddContractorTransactionModal"; // Import the new modal

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

interface ContractorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContractor: Contractor | null;
  sites: Site[];
  setIsAssignSiteModalOpen: (open: boolean) => void;
  setSelectedSiteId: (id: string) => void;
  setIsTransactionsModalOpen: (open: boolean) => void;
  setTransactions: (transactions: any[]) => void;
  setError: (error: string | null) => void;
  isAnimating: boolean;
  handleAddTransaction: (data: any) => Promise<any>; // Add this prop
}

const ContractorDetailsModal: React.FC<ContractorDetailsModalProps> = ({
  isOpen,
  onClose,
  selectedContractor,
  sites,
  setIsAssignSiteModalOpen,
  setSelectedSiteId,
  setIsTransactionsModalOpen,
  setTransactions,
  setError,
  isAnimating,
  handleAddTransaction,
}) => {
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] =
    useState(false);

  if (!isOpen || !selectedContractor) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-200 transform overflow-hidden ${
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        } max-w-4xl w-full mx-4`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl" />

        <div className="p-8">
          {/* Existing content remains unchanged */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {selectedContractor.name.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {selectedContractor.name}
                </h2>
                <p className="text-lg text-gray-600">
                  {selectedContractor.company || "No Company"}
                </p>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                    selectedContractor.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedContractor.status === "active"
                    ? "Active"
                    : "Blocked"}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users size={20} className="mr-2 text-blue-600" />
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail size={16} className="text-gray-500" />
                    <span className="text-gray-700">
                      {selectedContractor.email}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone size={16} className="text-gray-500" />
                    <span className="text-gray-700">
                      {selectedContractor.phone || "Not provided"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Building2 size={16} className="text-gray-500" />
                    <span className="text-gray-700">
                      {selectedContractor.company || "Not provided"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <MapPin size={20} className="mr-2 text-green-600" />
                    Site Assignments (
                    {selectedContractor.siteAssignments.length})
                  </h3>
                  <button
                    onClick={() => setIsAssignSiteModalOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200 flex items-center space-x-2"
                  >
                    <Plus size={16} />
                    <span>Assign Site</span>
                  </button>
                </div>

                {selectedContractor.siteAssignments.length > 0 ? (
                  <div className="space-y-4">
                    {selectedContractor.siteAssignments.map((assignment) => (
                      <div
                        key={assignment.site.id}
                        className="bg-gray-50 rounded-xl p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                            <MapPin size={18} className="text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {assignment.site.name}
                            </h4>
                            <p
                              className={`text-sm font-medium ${
                                assignment.balance >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              Balance: ${assignment.balance.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            setSelectedSiteId(assignment.site.id);
                            try {
                              const txs = await getContractorTransactions(
                                selectedContractor.id,
                                assignment.site.id
                              );
                              setTransactions(txs);
                              setIsTransactionsModalOpen(true);
                            } catch (err) {
                              setError("Failed to fetch transactions.");
                            }
                          }}
                          className="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                        >
                          <Activity size={14} />
                          <span className="text-sm">Transactions</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No sites assigned yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => setIsAddTransactionModalOpen(true)} // Open the new modal
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200 flex items-center space-x-2"
            >
              <DollarSign size={16} />
              <span>Add Transaction</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Render the new AddTransactionModal */}
      <AddTransactionModal
        isOpen={isAddTransactionModalOpen}
        onClose={() => setIsAddTransactionModalOpen(false)}
        contractor={selectedContractor}
        onAddTransaction={handleAddTransaction}
      />
    </div>
  );
};

export default ContractorDetailsModal;
