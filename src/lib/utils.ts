import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSD(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(1)}%`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '…';
}

export function extractOfferId(url: string): string | null {
  const match = url.match(/\/offer\/(\d+)/);
  return match ? match[1] : null;
}

export function is1688Url(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('1688.com');
  } catch {
    return false;
  }
}

export function getRecommendationColor(recommendation: string): string {
  switch (recommendation) {
    case 'STRONG_OPPORTUNITY': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'WORTH_INVESTIGATING': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'LOW_PRIORITY': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'NOT_RECOMMENDED': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getRecommendationLabel(recommendation: string): string {
  switch (recommendation) {
    case 'STRONG_OPPORTUNITY': return 'Strong Opportunity';
    case 'WORTH_INVESTIGATING': return 'Worth Investigating';
    case 'LOW_PRIORITY': return 'Low Priority';
    case 'NOT_RECOMMENDED': return 'Not Recommended';
    case 'INSUFFICIENT_DATA': return 'Insufficient Data';
    default: return recommendation;
  }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
