/**
 * 日付ユーティリティ
 */

/**
 * 現在のISO日時文字列を取得
 */
export function nowISOString(): string {
  return new Date().toISOString();
}

/**
 * 指定日数後の日付を取得
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 日付が今日より前かどうか
 */
export function isPastDue(dueDate: Date | string): boolean {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();
  // 時刻を無視して日付のみで比較
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due <= now;
}

/**
 * 2つの日付の差を日数で取得
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return Math.round(Math.abs((d2.getTime() - d1.getTime()) / oneDay));
}

/**
 * 今日の開始時刻（0:00:00）を取得
 */
export function startOfDay(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * 今日の終了時刻（23:59:59.999）を取得
 */
export function endOfDay(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * 月の初日を取得
 */
export function startOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * 月の最終日を取得
 */
export function endOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}
