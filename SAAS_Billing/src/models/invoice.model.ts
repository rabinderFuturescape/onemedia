/**
 * Invoice Model
 * 
 * Represents an invoice in the Lago billing system.
 * Invoices are generated based on subscriptions and usage.
 */

export type InvoiceStatus = 'draft' | 'finalized' | 'voided';
export type InvoicePaymentStatus = 'pending' | 'succeeded' | 'failed';
export type InvoiceType = 'subscription' | 'add_on' | 'credit' | 'one_off';

export interface InvoiceFee {
  id: string;
  feeType: string;
  itemCode: string;
  itemName: string;
  description?: string;
  amountCents: number;
  amountCurrency: string;
  taxesAmountCents: number;
  taxesRate: number;
  units: number;
  preciseUnitAmount: number;
  totalAmountCents: number;
  totalAmountCurrency: string;
  events?: {
    id: string;
    code: string;
    timestamp: string;
  }[];
  taxes?: {
    id: string;
    code: string;
    name: string;
    rate: number;
    amountCents: number;
    amountCurrency: string;
  }[];
}

export interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  paymentStatus: InvoicePaymentStatus;
  invoiceType: InvoiceType;
  issuingDate: string;
  amountCents: number;
  amountCurrency: string;
  taxesAmountCents: number;
  taxesRate: number;
  subtotalExcludingTaxesAmountCents: number;
  subtotalIncludingTaxesAmountCents: number;
  totalAmountCents: number;
  totalAmountCurrency: string;
  fileUrl?: string;
  customer: {
    id: string;
    name: string;
    externalId: string;
  };
  fees: InvoiceFee[];
  credits?: {
    id: string;
    amountCents: number;
    amountCurrency: string;
  }[];
  metadata?: {
    key: string;
    value: string;
  }[];
  updatedAt: string;
  createdAt: string;
}

export interface InvoiceCreateInput {
  externalCustomerId: string;
  currency: string;
  fees: {
    addOnCode?: string;
    amountCents: number;
    description?: string;
    units?: number;
    taxCodes?: string[];
  }[];
  metadata?: {
    key: string;
    value: string;
  }[];
}

export interface InvoiceUpdateInput {
  invoiceId: string;
  status?: InvoiceStatus;
  metadata?: {
    key: string;
    value: string;
  }[];
}

export interface InvoiceResponse {
  invoice: Invoice;
}

export interface InvoicesResponse {
  invoices: Invoice[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}
