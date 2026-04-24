import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  Plus,
  Users,
  Eye,
  DollarSign,
  Trash2,
  Edit,
  X,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import {
  getAllContractors,
  createContractor,
  assignSiteToContractor,
  unassignSiteFromContractor,
  updateContractor,
  deleteContractor,
  getContractorTransactions,
  addTransaction,
  deleteContractorTransaction,
} from "@/services/contractorService";
import AddContractorModal from "./AddContractorModal";
import AddTransactionModal from "./AddContractorTransactionModal";
import DeleteContractorModal from "./DeleteContractorModal";
import { toast } from "sonner";

interface Contractor {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "active" | "blocked";
  siteAssignments: { site: { id: string; name: string }; totalAmount: number }[];
}

interface SiteContractorsManagerProps {
  siteId: string;
  siteName?: string;
  userType: "admin" | "siteManager" | "architect" | "supervisor";
}

const SiteContractorsManager: React.FC<SiteContractorsManagerProps> = ({
  siteId,
  siteName,
  userType,
}) => {
  const [allContractors, setAllContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignExistingModalOpen, setIsAssignExistingModalOpen] =
    useState(false);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] =
    useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewTransactionsModalOpen, setIsViewTransactionsModalOpen] =
    useState(false);

  const [selectedContractor, setSelectedContractor] =
    useState<Contractor | null>(null);
  const [contractorToEdit, setContractorToEdit] = useState<Contractor | null>(
    null,
  );
  const [contractorToDelete, setContractorToDelete] =
    useState<Contractor | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [newContractorForm, setNewContractorForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const [inputErrors, setInputErrors] = useState({
    name: false,
    email: false,
    phone: false,
    company: false,
  });

  // Permission checks
  const isAdmin = userType === "admin";
  const canAdd = isAdmin || userType === "siteManager";
  const canAssign = isAdmin;
  const canEdit = isAdmin;
  const canDelete = isAdmin;
  const canAddTransaction = isAdmin || userType === "siteManager";

  // Fetch all contractors
  const fetchAllContractors = async () => {
    try {
      const data = await getAllContractors();
      setAllContractors(data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load contractors");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllContractors();
  }, [siteId]);

  // Filter contractors assigned to this site
  const assignedContractors = useMemo(() => {
    return allContractors.filter((c) =>
      c.siteAssignments.some((sa) => sa.site.id === siteId),
    );
  }, [allContractors, siteId]);

  // Further search filter
  const filteredContractors = assignedContractors.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Helper: get total amount for current site
  const getTotalAmountForSite = (contractor: Contractor) => {
    const assignment = contractor.siteAssignments.find(
      (sa) => sa.site.id === siteId,
    );
    return assignment ? assignment.totalAmount : 0;
  };

  // ----- Handlers -----
  const handleAddNewContractor = async (e: React.MouseEvent) => {
    e.preventDefault();
    const isValidEmail = (email: string) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const errors = {
      name: !newContractorForm.name.trim(),
      email:
        !newContractorForm.email.trim() ||
        !isValidEmail(newContractorForm.email),
      phone: false,
      company: false,
    };
    setInputErrors(errors);
    if (errors.name || errors.email) return;

    try {
      const created = await createContractor(newContractorForm);
      await assignSiteToContractor(created.id, siteId);
      await fetchAllContractors();
      setNewContractorForm({ name: "", email: "", phone: "", company: "" });
      setIsAddModalOpen(false);
    } catch (err) {
      setError("Failed to add contractor and assign to site");
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (
      !window.confirm(
        "Delete this transaction? This action will reverse all accounting entries.",
      )
    )
      return;
    try {
      await deleteContractorTransaction(transactionId);
      // refresh transactions and contractor list
      if (selectedContractor) {
        const txs = await getContractorTransactions(
          selectedContractor.id,
          siteId,
        );
        setTransactions(txs);
        await fetchAllContractors(); // refresh balances
        toast.success("Transaction deleted");
      }
    } catch (err) {
      toast.error("Failed to delete transaction");
    }
  };

  const handleAssignExisting = async (contractorId: string) => {
    try {
      await assignSiteToContractor(contractorId, siteId);
      await fetchAllContractors();
      setIsAssignExistingModalOpen(false);
    } catch (err) {
      setError("Failed to assign contractor");
    }
  };

  const handleRemoveFromSite = async (contractor: Contractor) => {
    if (!window.confirm(`Remove ${contractor.name} from this site?`)) return;
    try {
      await unassignSiteFromContractor(contractor.id, siteId);
      await fetchAllContractors();
    } catch (err) {
      setError("Failed to remove contractor from site");
    }
  };

  const handleAddTransaction = async (data: any) => {
    try {
      await addTransaction(data);
      await fetchAllContractors();
      setIsAddTransactionModalOpen(false);
    } catch (err) {
      setError("Transaction failed");
      throw err;
    }
  };

  const handleViewTransactions = async (contractor: Contractor) => {
    setSelectedContractor(contractor);
    try {
      const txs = await getContractorTransactions(contractor.id, siteId);
      setTransactions(txs);
      setIsViewTransactionsModalOpen(true);
    } catch (err) {
      setError("Failed to load transactions");
    }
  };

  const handleEditContractor = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!contractorToEdit) return;
    const isValidEmail = (email: string) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const errors = {
      name: !newContractorForm.name.trim(),
      email:
        !newContractorForm.email.trim() ||
        !isValidEmail(newContractorForm.email),
      phone: false,
      company: false,
    };
    setInputErrors(errors);
    if (errors.name || errors.email) return;

    try {
      await updateContractor(contractorToEdit.id, {
        name: newContractorForm.name,
        email: newContractorForm.email,
        phone: newContractorForm.phone,
        company: newContractorForm.company,
      });
      await fetchAllContractors();
      setIsEditModalOpen(false);
      setContractorToEdit(null);
      setNewContractorForm({ name: "", email: "", phone: "", company: "" });
    } catch (err) {
      setError("Update failed");
    }
  };

  const handleDeleteContractor = async () => {
    if (!contractorToDelete) return;
    const otherSites = contractorToDelete.siteAssignments.filter(
      (sa) => sa.site.id !== siteId,
    );
    if (otherSites.length > 0) {
      if (
        !window.confirm(
          `This contractor is also assigned to ${otherSites.length} other site(s). Deleting will remove them completely. Continue?`,
        )
      )
        return;
    }
    try {
      await deleteContractor(contractorToDelete.id);
      await fetchAllContractors();
      setIsDeleteModalOpen(false);
      setContractorToDelete(null);
    } catch (err) {
      setError("Delete failed");
    }
  };

  if (loading)
    return (
      <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="text-center py-8">Loading contractors...</div>
      </div>
    );
  if (error)
    return (
      <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="text-red-500 py-4">{error}</div>
      </div>
    );

  // Unassigned contractors list for assignment modal
  const unassignedContractors = allContractors.filter(
    (c) => !c.siteAssignments.some((sa) => sa.site.id === siteId),
  );

  return (
    <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 transition-all duration-500">
      {/* Gradient header bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-t-2xl" />

      <div className="p-6">
        {/* Header with title and action buttons */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Contractors ({filteredContractors.length})</span>
          </h3>
          <div className="flex gap-3">
            {canAdd && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Contractor</span>
              </button>
            )}
            {canAssign && (
              <button
                onClick={() => setIsAssignExistingModalOpen(true)}
                className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Existing</span>
              </button>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search contractors by name, email or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Contractors list */}
        {filteredContractors.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {searchTerm
                ? "No contractors match your search."
                : "No contractors assigned to this site yet."}
            </p>
            {canAdd && !searchTerm && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-3 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + Add your first contractor
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredContractors.map((contractor) => (
              <div
                key={contractor.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors flex-wrap gap-3"
              >
                {/* Left section: Avatar + Details */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-semibold text-sm">
                      {contractor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {contractor.name}
                      </span>
                      {contractor.company && (
                        <span className="text-sm text-gray-500">
                          ({contractor.company})
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          contractor.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {contractor.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {contractor.email}
                    </div>
                    <div className="text-sm font-medium text-emerald-600 mt-0.5">
                      Total Amount: ₹
                      {getTotalAmountForSite(contractor).toLocaleString(
                        "en-IN",
                      )}
                    </div>
                  </div>
                </div>

                {/* Right section: Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {canAddTransaction && (
                    <button
                      onClick={() => {
                        setSelectedContractor(contractor);
                        setIsAddTransactionModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-emerald-700 transition-colors"
                    >
                      <DollarSign size={14} />
                      <span className="hidden sm:inline">Add Tx</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleViewTransactions(contractor)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-blue-700 transition-colors"
                  >
                    <Eye size={14} />
                    <span className="hidden sm:inline">Txns</span>
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => {
                        setContractorToEdit(contractor);
                        setNewContractorForm({
                          name: contractor.name,
                          email: contractor.email,
                          phone: contractor.phone,
                          company: contractor.company,
                        });
                        setIsEditModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                  )}
                  {canAssign && (
                    <button
                      onClick={() => handleRemoveFromSite(contractor)}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                    >
                      <X size={14} />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => {
                        setContractorToDelete(contractor);
                        setIsDeleteModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODALS */}
      <AddContractorModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setNewContractorForm({ name: "", email: "", phone: "", company: "" });
          setInputErrors({
            name: false,
            email: false,
            phone: false,
            company: false,
          });
        }}
        onSubmit={handleAddNewContractor}
        newContractor={newContractorForm}
        setNewContractor={setNewContractorForm}
        inputErrors={inputErrors}
        sizeStyles="max-w-2xl w-full"
      />

      <AddContractorModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setContractorToEdit(null);
          setNewContractorForm({ name: "", email: "", phone: "", company: "" });
        }}
        onSubmit={handleEditContractor}
        newContractor={newContractorForm}
        setNewContractor={setNewContractorForm}
        inputErrors={inputErrors}
        sizeStyles="max-w-2xl w-full"
        isEditMode={true}
      />

      {/* Assign Existing Contractor Modal */}
      {isAssignExistingModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Assign Existing Contractor</h3>
              <button
                onClick={() => setIsAssignExistingModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X />
              </button>
            </div>
            {unassignedContractors.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                All contractors are already assigned to this site.
              </p>
            ) : (
              <ul className="space-y-2 max-h-96 overflow-auto">
                {unassignedContractors.map((c) => (
                  <li
                    key={c.id}
                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-sm text-gray-500">
                        {c.company || "No company"}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssignExisting(c.id)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                    >
                      Assign
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {selectedContractor && (
        <AddTransactionModal
          isOpen={isAddTransactionModalOpen}
          onClose={() => setIsAddTransactionModalOpen(false)}
          contractor={selectedContractor}
          onAddTransaction={handleAddTransaction}
          defaultSiteId={siteId}
        />
      )}

      {/* View Transactions Modal */}
      {isViewTransactionsModalOpen && selectedContractor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                Transactions – {selectedContractor.name}
              </h3>
              <button
                onClick={() => setIsViewTransactionsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X />
              </button>
            </div>
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No transactions yet.
              </p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                    )
                    .map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm capitalize">
                          {tx.type}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          ₹{tx.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {tx.category || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {tx.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <DeleteContractorModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteContractor}
        contractorName={contractorToDelete?.name || ""}
      />
    </div>
  );
};

export default SiteContractorsManager;
