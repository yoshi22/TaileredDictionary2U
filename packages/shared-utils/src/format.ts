/**
 * フォーマットユーティリティ
 */

/**
 * 相対時間表示（例: "3日後", "1時間前"）
 */
export function formatRelativeTime(date: Date | string, locale: string = 'ja-JP'): string {
  const target = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffDays) >= 1) {
    return rtf.format(diffDays, 'day');
  } else if (Math.abs(diffHours) >= 1) {
    return rtf.format(diffHours, 'hour');
  } else {
    return rtf.format(diffMinutes, 'minute');
  }
}

/**
 * 日付を日本語フォーマット（例: "2025年1月7日"）
 */
export function formatDateJa(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 日付を短縮フォーマット（例: "1/7"）
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
  });
}

/**
 * 数値にカンマ区切りを追加
 */
export function formatNumber(num: number, locale: string = 'ja-JP'): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * パーセンテージ表示
 */
export function formatPercent(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 時間をMM:SS形式でフォーマット
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 文字列を指定長で切り詰め
 */
export function truncate(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}
