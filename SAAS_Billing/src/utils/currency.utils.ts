/**
 * Currency Utilities
 * 
 * Utility functions for working with currencies and amounts.
 */

/**
 * Convert an amount to cents
 * 
 * @param amount - The amount in the currency's base unit
 * @returns The amount in cents
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert an amount from cents to the currency's base unit
 * 
 * @param cents - The amount in cents
 * @returns The amount in the currency's base unit
 */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Format an amount as a currency string
 * 
 * @param amount - The amount in the currency's base unit
 * @param currency - The currency code (e.g., 'USD', 'EUR')
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @returns The formatted currency string
 */
export function formatCurrency(amount: number, currency: string, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format an amount in cents as a currency string
 * 
 * @param cents - The amount in cents
 * @param currency - The currency code (e.g., 'USD', 'EUR')
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @returns The formatted currency string
 */
export function formatCentsAsCurrency(cents: number, currency: string, locale: string = 'en-US'): string {
  return formatCurrency(fromCents(cents), currency, locale);
}

/**
 * Get the currency symbol for a currency code
 * 
 * @param currency - The currency code (e.g., 'USD', 'EUR')
 * @param locale - The locale to use (default: 'en-US')
 * @returns The currency symbol
 */
export function getCurrencySymbol(currency: string, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
  })
    .formatToParts(0)
    .find(part => part.type === 'currency')?.value || currency;
}

/**
 * Supported currencies in Lago
 */
export const SUPPORTED_CURRENCIES = [
  'USD', // US Dollar
  'EUR', // Euro
  'GBP', // British Pound
  'AUD', // Australian Dollar
  'CAD', // Canadian Dollar
  'JPY', // Japanese Yen
  'CHF', // Swiss Franc
  'CNY', // Chinese Yuan
  'INR', // Indian Rupee
  'BRL', // Brazilian Real
  'MXN', // Mexican Peso
  'SGD', // Singapore Dollar
  'HKD', // Hong Kong Dollar
  'SEK', // Swedish Krona
  'NOK', // Norwegian Krone
  'DKK', // Danish Krone
  'PLN', // Polish Złoty
  'RUB', // Russian Ruble
  'TRY', // Turkish Lira
  'ZAR', // South African Rand
];
