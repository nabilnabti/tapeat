export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1).replace(/\.0$/, '')}km`;
}

export function formatCurrency(amount: number): string {
  return amount.toFixed(2) + ' €';
}