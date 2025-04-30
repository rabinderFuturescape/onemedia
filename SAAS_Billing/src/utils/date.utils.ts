/**
 * Date Utilities
 * 
 * Utility functions for working with dates in the billing system.
 */

/**
 * Get the first day of the current month
 * 
 * @param date - Optional date to use (default: current date)
 * @returns The first day of the month
 */
export function getFirstDayOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the last day of the current month
 * 
 * @param date - Optional date to use (default: current date)
 * @returns The last day of the month
 */
export function getLastDayOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Get the first day of the next month
 * 
 * @param date - Optional date to use (default: current date)
 * @returns The first day of the next month
 */
export function getFirstDayOfNextMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

/**
 * Format a date as an ISO string without the time component
 * 
 * @param date - The date to format
 * @returns The formatted date string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Add days to a date
 * 
 * @param date - The date to add days to
 * @param days - The number of days to add
 * @returns The new date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date
 * 
 * @param date - The date to add months to
 * @param months - The number of months to add
 * @returns The new date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Calculate the number of days between two dates
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns The number of days between the dates
 */
export function daysBetween(startDate: Date, endDate: Date): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((startDate.getTime() - endDate.getTime()) / millisecondsPerDay));
}

/**
 * Check if a date is in the past
 * 
 * @param date - The date to check
 * @returns True if the date is in the past
 */
export function isInPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Check if a date is in the future
 * 
 * @param date - The date to check
 * @returns True if the date is in the future
 */
export function isInFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Get the start and end dates for a billing period
 * 
 * @param billingType - The billing type ('monthly', 'quarterly', 'yearly')
 * @param referenceDate - Optional reference date (default: current date)
 * @returns The start and end dates for the billing period
 */
export function getBillingPeriod(
  billingType: 'monthly' | 'quarterly' | 'yearly',
  referenceDate: Date = new Date()
): { startDate: Date; endDate: Date } {
  const startDate = new Date(referenceDate);
  const endDate = new Date(referenceDate);
  
  switch (billingType) {
    case 'monthly':
      startDate.setDate(1);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      break;
    case 'quarterly':
      const quarterStartMonth = Math.floor(startDate.getMonth() / 3) * 3;
      startDate.setMonth(quarterStartMonth);
      startDate.setDate(1);
      endDate.setMonth(quarterStartMonth + 3);
      endDate.setDate(0);
      break;
    case 'yearly':
      startDate.setMonth(0);
      startDate.setDate(1);
      endDate.setFullYear(endDate.getFullYear() + 1);
      endDate.setMonth(0);
      endDate.setDate(0);
      break;
  }
  
  return { startDate, endDate };
}
