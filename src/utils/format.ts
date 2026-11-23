/**
 * Currency and Number Formatting Utility
 */

export const formatCurrency = (val: number, currency: string = 'MAD'): string => {
  const num = Number(val) || 0;
  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const curr = (currency || 'MAD').trim();

  // If currency code is alphanumeric (e.g., MAD, SAR, AED, CHF, USD), add space
  if (/^[A-Za-z]+$/.test(curr)) {
    return `${curr} ${formatted}`;
  }
  return `${curr}${formatted}`;
};

export const formatCompactCurrency = (val: number, currency: string = 'MAD'): string => {
  const num = Number(val) || 0;
  const curr = (currency || 'MAD').trim();
  const isAlpha = /^[A-Za-z]+$/.test(curr);
  const sep = isAlpha ? ' ' : '';

  if (Math.abs(num) >= 1_000_000) {
    return `${curr}${sep}${(num / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 1_000) {
    return `${curr}${sep}${(num / 1_000).toFixed(0)}k`;
  }
  return `${curr}${sep}${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};
