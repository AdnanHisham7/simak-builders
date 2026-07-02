export const computeWeightedAveragePrice = (
  existingQuantity: number,
  existingAveragePrice: number,
  incomingQuantity: number,
  incomingPrice: number,
): number => {
  const totalQuantity = existingQuantity + incomingQuantity;
  if (totalQuantity <= 0) return 0;
  const totalValue =
    existingQuantity * existingAveragePrice + incomingQuantity * incomingPrice;
  return totalValue / totalQuantity;
};