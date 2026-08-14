import { useEffect, useState, useMemo } from "react";
import { Search, Plus, Users, Eye, DollarSign, Trash2, Edit, UserPlus, UserMinus } from "lucide-react";
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
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import PageLoader from "@/components/ui/PageLoader";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tooltip from "@/components/ui/Tooltip";

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
  userType,
}) => {
  const [allContractors, setAllContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignExistingModalOpen, setIsAssignExistingModalOpen] = useState(false);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewTransactionsModalOpen, setIsViewTransactionsModalOpen] = useState(false);

  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [contractorToEdit, setContractorToEdit] = useState<Contractor | null>(null);
  const [contractorToDelete, setContractorToDelete] = useState<Contractor | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Contractor | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [multiSiteDeleteConfirm, setMultiSiteDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const isAdmin = userType === "admin";
  const canAdd = isAdmin || userType === "siteManager";
  const canAssign = isAdmin;
  const canEdit = isAdmin;
  const canDelete = isAdmin;
  const canAddTransaction = isAdmin || userType === "siteManager";

  const fetchAllContractors = async () => {
    try {
      const data = await getAllContractors();
      setAllContractors(data);
      setPageError(null);
    } catch (err) {
      setPageError("Failed to load contractors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllContractors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  const assignedContractors = useMemo(
    () => allContractors.filter((c) => c.siteAssignments.some((sa) => sa.site.id === siteId)),
    [allContractors, siteId],
  );

  const filteredContractors = assignedContractors.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const getTotalAmountForSite = (contractor: Contractor) => {
    const assignment = contractor.siteAssignments.find((sa) => sa.site.id === siteId);
    return assignment ? assignment.totalAmount : 0;
  };

  const handleAddNewContractor = async (e: React.MouseEvent) => {
    e.preventDefault();
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const errors = {
      name: !newContractorForm.name.trim(),
      email: !newContractorForm.email.trim() || !isValidEmail(newContractorForm.email),
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
      toast.success("Contractor added and assigned to this site");
    } catch (err) {
      toast.error("Failed to add contractor and assign to site");
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await deleteContractorTransaction(transactionId);
      if (selectedContractor) {
        const txs = await getContractorTransactions(selectedContractor.id, siteId);
        setTransactions(txs);
        await fetchAllContractors();
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
      toast.success("Contractor assigned to this site");
    } catch (err) {
      toast.error("Failed to assign contractor");
    }
  };

  const handleRemoveFromSite = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      await unassignSiteFromContractor(removeTarget.id, siteId);
      await fetchAllContractors();
      toast.success("Contractor removed from this site");
      setRemoveTarget(null);
    } catch (err) {
      toast.error("Failed to remove contractor from site");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleAddTransaction = async (data: any) => {
    try {
      await addTransaction(data);
      await fetchAllContractors();
      setIsAddTransactionModalOpen(false);
    } catch (err) {
      toast.error("Transaction failed");
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
      toast.error("Failed to load transactions");
    }
  };

  const handleEditContractor = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!contractorToEdit) return;
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const errors = {
      name: !newContractorForm.name.trim(),
      email: !newContractorForm.email.trim() || !isValidEmail(newContractorForm.email),
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
      toast.success("Contractor updated");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const proceedDeleteContractor = async () => {
    if (!contractorToDelete) return;
    setIsDeleting(true);
    try {
      await deleteContractor(contractorToDelete.id);
      await fetchAllContractors();
      setIsDeleteModalOpen(false);
      setContractorToDelete(null);
      setMultiSiteDeleteConfirm(false);
      toast.success("Contractor deleted");
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteContractor = async () => {
    if (!contractorToDelete) return;
    const otherSites = contractorToDelete.siteAssignments.filter((sa) => sa.site.id !== siteId);
    if (otherSites.length > 0) {
      setMultiSiteDeleteConfirm(true);
      return;
    }
    await proceedDeleteContractor();
  };

  if (loading) {
    return (
      <Card>
        <PageLoader label="Loading contractors" fullHeight={false} />
      </Card>
    );
  }

  if (pageError) {
    return (
      <Card>
        <p className="py-4 text-center text-sm text-danger-600">{pageError}</p>
      </Card>
    );
  }

  const unassignedContractors = allContractors.filter(
    (c) => !c.siteAssignments.some((sa) => sa.site.id === siteId),
  );

  return (
    <Card>
      <div className="mb-6 flex items-center justify-between">
        <h3 className="flex items-center gap-2.5 text-base font-semibold text-console-text">
          <Users size={20} className="text-brand-600" />
          Contractors ({filteredContractors.length})
        </h3>
        <div className="flex gap-2">
          {canAdd && (
            <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
              <UserPlus size={15} /> Add contractor
            </Button>
          )}
          {canAssign && (
            <Button size="sm" variant="secondary" onClick={() => setIsAssignExistingModalOpen(true)}>
              <Plus size={15} /> Assign existing
            </Button>
          )}
        </div>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-console-muted" size={16} />
        <input
          type="text"
          placeholder="Search contractors by name, email, or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-console-border py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {filteredContractors.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchTerm ? "No contractors match your search" : "No contractors assigned to this site yet"}
          action={
            canAdd &&
            !searchTerm && (
              <Button variant="secondary" onClick={() => setIsAddModalOpen(true)}>
                Add your first contractor
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-3">
          {filteredContractors.map((contractor) => (
            <div
              key={contractor.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-console bg-console-bg p-4 transition-colors hover:bg-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
                  {contractor.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-console-text">{contractor.name}</span>
                    {contractor.company && (
                      <span className="text-xs text-console-muted">({contractor.company})</span>
                    )}
                    <Badge variant={contractor.status === "active" ? "success" : "error"}>
                      {contractor.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-console-muted">{contractor.email}</div>
                  <div className="mt-0.5 text-sm font-medium text-success-700">
                    Total amount: ₹{getTotalAmountForSite(contractor).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {canAddTransaction && (
                  <Tooltip label="Add transaction">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedContractor(contractor);
                        setIsAddTransactionModalOpen(true);
                      }}
                      aria-label="Add transaction"
                      className="rounded-lg p-2 text-console-muted transition-colors hover:bg-success-50 hover:text-success-700"
                    >
                      <DollarSign size={16} />
                    </button>
                  </Tooltip>
                )}
                <Tooltip label="View transactions">
                  <button
                    type="button"
                    onClick={() => handleViewTransactions(contractor)}
                    aria-label="View transactions"
                    className="rounded-lg p-2 text-console-muted transition-colors hover:bg-info-50 hover:text-info-700"
                  >
                    <Eye size={16} />
                  </button>
                </Tooltip>
                {canEdit && (
                  <Tooltip label="Edit contractor">
                    <button
                      type="button"
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
                      aria-label="Edit contractor"
                      className="rounded-lg p-2 text-console-muted transition-colors hover:bg-warning-50 hover:text-warning-700"
                    >
                      <Edit size={16} />
                    </button>
                  </Tooltip>
                )}
                {canAssign && (
                  <Tooltip label="Remove from site">
                    <button
                      type="button"
                      onClick={() => setRemoveTarget(contractor)}
                      aria-label="Remove from site"
                      className="rounded-lg p-2 text-console-muted transition-colors hover:bg-danger-50 hover:text-danger-700"
                    >
                      <UserMinus size={16} />
                    </button>
                  </Tooltip>
                )}
                {canDelete && (
                  <Tooltip label="Delete contractor">
                    <button
                      type="button"
                      onClick={() => {
                        setContractorToDelete(contractor);
                        setIsDeleteModalOpen(true);
                      }}
                      aria-label="Delete contractor"
                      className="rounded-lg p-2 text-console-muted transition-colors hover:bg-danger-50 hover:text-danger-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddContractorModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setNewContractorForm({ name: "", email: "", phone: "", company: "" });
          setInputErrors({ name: false, email: false, phone: false, company: false });
        }}
        onSubmit={handleAddNewContractor}
        newContractor={newContractorForm}
        setNewContractor={setNewContractorForm}
        inputErrors={inputErrors}
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
        isEditMode
      />

      <Modal
        isOpen={isAssignExistingModalOpen}
        onClose={() => setIsAssignExistingModalOpen(false)}
        title="Assign Existing Contractor"
      >
        {unassignedContractors.length === 0 ? (
          <p className="py-4 text-center text-sm text-console-muted">
            All contractors are already assigned to this site.
          </p>
        ) : (
          <ul className="max-h-96 space-y-2 overflow-auto">
            {unassignedContractors.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-console-border p-3 hover:bg-console-bg"
              >
                <div>
                  <div className="text-sm font-medium text-console-text">{c.name}</div>
                  <div className="text-xs text-console-muted">{c.company || "No company"}</div>
                </div>
                <Button size="sm" onClick={() => handleAssignExisting(c.id)}>
                  Assign
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {selectedContractor && (
        <AddTransactionModal
          isOpen={isAddTransactionModalOpen}
          onClose={() => setIsAddTransactionModalOpen(false)}
          contractor={selectedContractor}
          onAddTransaction={handleAddTransaction}
          defaultSiteId={siteId}
        />
      )}

      <Modal
        isOpen={isViewTransactionsModalOpen && !!selectedContractor}
        onClose={() => setIsViewTransactionsModalOpen(false)}
        title={`Transactions — ${selectedContractor?.name ?? ""}`}
        size="xl"
      >
        {transactions.length === 0 ? (
          <EmptyState icon={DollarSign} title="No transactions yet" />
        ) : (
          <div className="overflow-x-auto rounded-console border border-console-border">
            <table className="min-w-full divide-y divide-console-border">
              <thead className="bg-console-bg">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-console-muted">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-console-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-console-border bg-white">
                {[...transactions]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-4 py-3 text-sm capitalize text-console-text">{tx.type}</td>
                      <td className="px-4 py-3 text-sm font-medium text-console-text">
                        ₹{tx.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-sm text-console-muted">{tx.category || "-"}</td>
                      <td className="px-4 py-3 text-sm text-console-muted">{tx.description || "-"}</td>
                      <td className="px-4 py-3 text-sm text-console-muted">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Tooltip label="Delete transaction">
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(tx.id)}
                            aria-label="Delete transaction"
                            className="rounded-lg p-1.5 text-danger-600 transition-colors hover:bg-danger-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <DeleteContractorModal
        isOpen={isDeleteModalOpen && !multiSiteDeleteConfirm}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setContractorToDelete(null);
        }}
        onConfirm={handleDeleteContractor}
        contractorName={contractorToDelete?.name || ""}
      />

      <ConfirmDialog
        isOpen={multiSiteDeleteConfirm}
        onClose={() => {
          setMultiSiteDeleteConfirm(false);
          setIsDeleteModalOpen(false);
          setContractorToDelete(null);
        }}
        onConfirm={proceedDeleteContractor}
        title="Contractor assigned to other sites"
        message={`This contractor is also assigned to ${
          contractorToDelete?.siteAssignments.filter((sa) => sa.site.id !== siteId).length ?? 0
        } other site(s). Deleting will remove them completely from all sites. Continue?`}
        variant="danger"
        confirmText="Delete everywhere"
        isLoading={isDeleting}
      />

      <ConfirmDialog
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemoveFromSite}
        title="Remove contractor"
        message={`Remove ${removeTarget?.name} from this site?`}
        variant="warning"
        confirmText="Remove"
        isLoading={isRemoving}
      />
    </Card>
  );
};

export default SiteContractorsManager;
