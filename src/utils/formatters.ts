export const formatPHP = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatNumber = (num: number, decimals: number = 2): string => {
  return (num || 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatKwh = (kwh: number, decimals: number = 2): string => {
  return `${formatNumber(kwh, decimals)} kWh`;
};

export const formatPercent = (val: number, decimals: number = 1): string => {
  return `${formatNumber(val, decimals)}%`;
};

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
};

export const formatMonth = (monthStr?: string): string => {
  if (!monthStr) return 'N/A';
  try {
    const [year, month] = monthStr.split('-');
    if (!year || !month) return monthStr;
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return new Intl.DateTimeFormat('en-PH', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return monthStr;
  }
};
