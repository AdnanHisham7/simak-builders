export interface EditableReportRow {
  id: string;
  itemOfWork: string;
  quantity: number | null;
  amount: number;
  isCustom: boolean;
}

export interface EditableTotals {
  totalAmount: number;
  supervisionAmount: number;
  netTotal: number;
}

let rowIdCounter = 0;

const generateRowId = (): string => {
  rowIdCounter += 1;
  return `row-${Date.now()}-${rowIdCounter}`;
};

export const roundToCents = (value: number): number => Math.round(value * 100) / 100;

export const displayAmount = (amount: number, roundAmounts: boolean): number =>
  roundAmounts ? Math.round(amount) : roundToCents(amount);

export const buildEditableRows = (transactions: any[]): EditableReportRow[] =>
  (transactions || []).map((t) => ({
    id: generateRowId(),
    itemOfWork: t.itemOfWork || t.description || t.type || "Item",
    quantity:
      t.quantity !== null && t.quantity !== undefined && t.quantity !== ""
        ? Number(t.quantity)
        : null,
    amount: roundToCents(Number(t.amount) || 0),
    isCustom: false,
  }));

export const createCustomRow = (
  itemOfWork: string,
  quantity: number | null,
  amount: number,
): EditableReportRow => ({
  id: generateRowId(),
  itemOfWork,
  quantity,
  amount: roundToCents(amount),
  isCustom: true,
});

export const removeRow = (rows: EditableReportRow[], id: string): EditableReportRow[] =>
  rows.filter((row) => row.id !== id);

export const updateRowAmount = (
  rows: EditableReportRow[],
  id: string,
  amount: number,
): EditableReportRow[] =>
  rows.map((row) => (row.id === id ? { ...row, amount: roundToCents(amount) } : row));

export const updateRowItemOfWork = (
  rows: EditableReportRow[],
  id: string,
  itemOfWork: string,
): EditableReportRow[] => {
  const trimmed = itemOfWork.trim();
  if (!trimmed) return rows;
  return rows.map((row) => (row.id === id ? { ...row, itemOfWork: trimmed } : row));
};

export const moveRow = (
  rows: EditableReportRow[],
  id: string,
  direction: "up" | "down" | "top" | "bottom",
): EditableReportRow[] => {
  const index = rows.findIndex((row) => row.id === id);
  if (index === -1) return rows;

  const result = [...rows];
  const [row] = result.splice(index, 1);

  if (direction === "up") {
    result.splice(Math.max(0, index - 1), 0, row);
  } else if (direction === "down") {
    result.splice(Math.min(result.length, index + 1), 0, row);
  } else if (direction === "top") {
    result.unshift(row);
  } else {
    result.push(row);
  }

  return result;
};

export const mergeRows = (
  rows: EditableReportRow[],
  ids: string[],
  mergedName: string,
): EditableReportRow[] => {
  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.length < 2) return rows;

  const selectedIndexed = uniqueIds
    .map((id) => ({ id, index: rows.findIndex((row) => row.id === id) }))
    .filter((entry) => entry.index !== -1)
    .sort((a, b) => a.index - b.index);

  if (selectedIndexed.length < 2) return rows;

  const selectedRows = selectedIndexed.map((entry) => rows[entry.index]);
  const selectedIdSet = new Set(selectedRows.map((row) => row.id));

  const hasQuantity = selectedRows.some((row) => row.quantity !== null);
  const mergedQuantity = hasQuantity
    ? selectedRows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0)
    : null;
  const mergedAmount = roundToCents(
    selectedRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
  );

  const trimmedName = mergedName.trim();
  const mergedRow: EditableReportRow = {
    id: generateRowId(),
    itemOfWork: trimmedName || selectedRows.map((row) => row.itemOfWork).join(" + "),
    quantity: mergedQuantity,
    amount: mergedAmount,
    isCustom: true,
  };

  const earliestIndex = selectedIndexed[0].index;
  const rowsBeforeEarliest = rows
    .slice(0, earliestIndex)
    .filter((row) => !selectedIdSet.has(row.id));
  const insertAt = rowsBeforeEarliest.length;

  const remaining = rows.filter((row) => !selectedIdSet.has(row.id));
  const result = [...remaining];
  result.splice(insertAt, 0, mergedRow);
  return result;
};

export const computeTotals = (
  rows: EditableReportRow[],
  supervisionPercentage: number,
  roundAmounts: boolean,
  supervisionOverride?: number | null,
): EditableTotals => {
  const totalAmount = roundToCents(
    rows.reduce((sum, row) => sum + displayAmount(Number(row.amount) || 0, roundAmounts), 0),
  );

  const supervisionAmount =
    supervisionOverride !== null && supervisionOverride !== undefined
      ? displayAmount(supervisionOverride, roundAmounts)
      : displayAmount((totalAmount * (Number(supervisionPercentage) || 0)) / 100, roundAmounts);

  const netTotal = displayAmount(totalAmount + supervisionAmount, roundAmounts);

  return { totalAmount, supervisionAmount, netTotal };
};

export const computeBalance = (rawBalance: number, roundBalance: boolean): number =>
  roundBalance ? Math.round(rawBalance) : roundToCents(rawBalance);