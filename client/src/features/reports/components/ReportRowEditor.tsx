import React, { useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Trash2, Plus, Combine, X } from "lucide-react";
import {
  EditableReportRow,
  createCustomRow,
  displayAmount,
  mergeRows,
  moveRow,
  removeRow,
  roundToCents,
  updateRowAmount,
} from "./editableReport";
import EditableAmountField from "./EditableAmountField";

interface ReportRowEditorProps {
  rows: EditableReportRow[];
  onRowsChange: (rows: EditableReportRow[]) => void;
  roundAmounts: boolean;
  onToggleRoundAmounts: (value: boolean) => void;
  disabled?: boolean;
}

const ReportRowEditor: React.FC<ReportRowEditorProps> = ({
  rows,
  onRowsChange,
  roundAmounts,
  onToggleRoundAmounts,
  disabled = false,
}) => {
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeName, setMergeName] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newRowName, setNewRowName] = useState("");
  const [newRowQuantity, setNewRowQuantity] = useState("");
  const [newRowAmount, setNewRowAmount] = useState("");
  const [addRowError, setAddRowError] = useState("");


  const toggleSelectForMerge = (id: string) => {
    if (disabled) return;
    setSelectedForMerge((prev) => {
      if (prev.includes(id)) return prev.filter((rowId) => rowId !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const clearSelection = () => setSelectedForMerge([]);

  const openMergeModal = () => {
    if (selectedForMerge.length !== 2) return;
    const firstRow = rows.find((row) => row.id === selectedForMerge[0]);
    setMergeName(firstRow ? firstRow.itemOfWork : "");
    setMergeModalOpen(true);
  };

  const confirmMerge = () => {
    if (selectedForMerge.length !== 2) return;
    const trimmedName = mergeName.trim();
    if (!trimmedName) return;

    const [firstId, secondId] = selectedForMerge;
    onRowsChange(mergeRows(rows, firstId, secondId, trimmedName));
    setSelectedForMerge([]);
    setMergeModalOpen(false);
    setMergeName("");
  };

  const cancelMerge = () => {
    setMergeModalOpen(false);
    setMergeName("");
  };

  const handleMove = (id: string, direction: "up" | "down" | "top" | "bottom") => {
    if (disabled) return;
    onRowsChange(moveRow(rows, id, direction));
  };

  const handleRemove = (id: string) => {
    if (disabled) return;
    setSelectedForMerge((prev) => prev.filter((rowId) => rowId !== id));
    onRowsChange(removeRow(rows, id));
  };

  const resetAddForm = () => {
    setNewRowName("");
    setNewRowQuantity("");
    setNewRowAmount("");
    setAddRowError("");
    setShowAddForm(false);
  };

  const handleAddRow = () => {
    const trimmedName = newRowName.trim();
    if (!trimmedName) {
      setAddRowError("Row name is required.");
      return;
    }

    if (newRowAmount.trim() === "") {
      setAddRowError("An amount is required.");
      return;
    }
    const parsedAmount = parseFloat(newRowAmount);
    if (Number.isNaN(parsedAmount)) {
      setAddRowError("Amount must be a valid number.");
      return;
    }

    let parsedQuantity: number | null = null;
    if (newRowQuantity.trim() !== "") {
      parsedQuantity = parseFloat(newRowQuantity);
      if (Number.isNaN(parsedQuantity)) {
        setAddRowError("Quantity must be a valid number.");
        return;
      }
    }

    onRowsChange([...rows, createCustomRow(trimmedName, parsedQuantity, parsedAmount)]);
    resetAddForm();
  };

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-1">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 select-none">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            checked={roundAmounts}
            disabled={disabled}
            onChange={(e) => onToggleRoundAmounts(e.target.checked)}
          />
          Round off all amounts (nearest whole Rupee)
        </label>

        <div className="flex items-center gap-2">
          {selectedForMerge.length === 2 && (
            <>
              <button
                type="button"
                onClick={openMergeModal}
                disabled={disabled}
                className="flex items-center px-3 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Combine className="w-4 h-4 mr-1.5" /> Merge Selected (2)
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="flex items-center px-3 py-2 text-sm font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 mr-1.5" /> Clear Selection
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            disabled={disabled}
            className="flex items-center px-3 py-2 text-sm font-medium bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Row
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Item / description"
              className="md:col-span-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={newRowName}
              onChange={(e) => setNewRowName(e.target.value)}
            />
            <input
              type="number"
              placeholder="Quantity (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={newRowQuantity}
              onChange={(e) => setNewRowQuantity(e.target.value)}
            />
            <input
              type="number"
              placeholder="Amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={newRowAmount}
              onChange={(e) => setNewRowAmount(e.target.value)}
            />
          </div>
          {addRowError && <p className="text-sm text-red-600 mt-2">{addRowError}</p>}
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={resetAddForm}
              className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mergeModalOpen &&
        createPortal(
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Merge Rows</h3>
              <p className="text-sm text-gray-500 mb-4">
                The amounts (and quantities, where present) of the two selected rows will be summed
                into a single row. Give the merged row a name.
              </p>
              <input
                type="text"
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
                placeholder="Merged row name"
                value={mergeName}
                onChange={(e) => setMergeName(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelMerge}
                  className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmMerge}
                  disabled={!mergeName.trim()}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  Confirm Merge
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      <div className="overflow-x-auto border border-gray-200 rounded-xl">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <th className="px-3 py-3 w-10" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Sl.No
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Item of Work
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row, idx) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={selectedForMerge.includes(row.id)}
                    disabled={disabled}
                    onChange={() => toggleSelectForMerge(row.id)}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{idx + 1}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {row.itemOfWork}
                  {row.isCustom && (
                    <span className="ml-2 inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 bg-indigo-50 rounded">
                      Custom
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                  {row.quantity !== null && row.quantity !== undefined ? row.quantity : "-"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <EditableAmountField
                    value={row.amount}
                    disabled={disabled}
                    onCommit={(amount) => onRowsChange(updateRowAmount(rows, row.id, amount))}
                    hint={
                      roundAmounts && roundToCents(row.amount) !== displayAmount(row.amount, true)
                        ? `rounds to ₹${displayAmount(row.amount, true).toLocaleString("en-IN")}`
                        : undefined
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      title="Move to top"
                      onClick={() => handleMove(row.id, "top")}
                      disabled={disabled || idx === 0}
                      className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronsUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Move up"
                      onClick={() => handleMove(row.id, "up")}
                      disabled={disabled || idx === 0}
                      className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Move down"
                      onClick={() => handleMove(row.id, "down")}
                      disabled={disabled || idx === rows.length - 1}
                      className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Move to bottom"
                      onClick={() => handleMove(row.id, "bottom")}
                      disabled={disabled || idx === rows.length - 1}
                      className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronsDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Remove row"
                      onClick={() => handleRemove(row.id)}
                      disabled={disabled}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportRowEditor;