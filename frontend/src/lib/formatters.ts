export function formatCurrencyINR(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '₹0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

export function formatDuration(t: any, timeInfo: { hours?: number; minutes?: number } | number | undefined | null): string {
  if (timeInfo === undefined || timeInfo === null) return '';
  
  if (typeof timeInfo === 'number') {
    if (timeInfo < 60) return `${timeInfo}m`;
    const hrs = Math.floor(timeInfo / 60);
    const mins = timeInfo % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  
  const { hours, minutes } = timeInfo;
  const parts = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  return parts.join(' ');
}

