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
  firstId: string,
  secondId: string,
  mergedName: string,
): EditableReportRow[] => {
  if (firstId === secondId) return rows;

  const firstIndex = rows.findIndex((row) => row.id === firstId);
  const secondIndex = rows.findIndex((row) => row.id === secondId);
  if (firstIndex === -1 || secondIndex === -1) return rows;

  const first = rows[firstIndex];
  const second = rows[secondIndex];

  const hasQuantity = first.quantity !== null || second.quantity !== null;
  const mergedQuantity = hasQuantity
    ? (Number(first.quantity) || 0) + (Number(second.quantity) || 0)
    : null;
  const mergedAmount = roundToCents(Number(first.amount || 0) + Number(second.amount || 0));

  const trimmedName = mergedName.trim();
  const mergedRow: EditableReportRow = {
    id: generateRowId(),
    itemOfWork: trimmedName || `${first.itemOfWork} + ${second.itemOfWork}`,
    quantity: mergedQuantity,
    amount: mergedAmount,
    isCustom: true,
  };

  const earlierIndex = Math.min(firstIndex, secondIndex);
  const rowsBeforeEarlier = rows
    .slice(0, earlierIndex)
    .filter((row) => row.id !== firstId && row.id !== secondId);
  const insertAt = rowsBeforeEarlier.length;

  const remaining = rows.filter((row) => row.id !== firstId && row.id !== secondId);
  const result = [...remaining];
  result.splice(insertAt, 0, mergedRow);
  return result;
};

export const computeTotals = (
  rows: EditableReportRow[],
  supervisionPercentage: number,
  roundAmounts: boolean,
): EditableTotals => {
  const totalAmount = roundToCents(
    rows.reduce((sum, row) => sum + displayAmount(Number(row.amount) || 0, roundAmounts), 0),
  );
  const supervisionRaw = (totalAmount * (Number(supervisionPercentage) || 0)) / 100;
  const supervisionAmount = displayAmount(supervisionRaw, roundAmounts);
  const netTotal = displayAmount(totalAmount + supervisionAmount, roundAmounts);

  return { totalAmount, supervisionAmount, netTotal };
};

export const computeBalance = (
  netTotal: number,
  varav: number,
  roundBalance: boolean,
): number => {
  const raw = netTotal - (Number(varav) || 0);
  return roundBalance ? Math.round(raw) : roundToCents(raw);
};