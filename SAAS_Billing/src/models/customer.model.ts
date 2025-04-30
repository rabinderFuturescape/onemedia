/**
 * Customer Model
 * 
 * Represents a customer in the Lago billing system.
 * Customers are the entities that are billed for usage and subscriptions.
 */

export interface CustomerMetadata {
  [key: string]: string | number | boolean;
}

export interface BillingConfiguration {
  invoiceGracePeriod?: number;
  paymentProvider?: 'stripe' | 'adyen' | 'gocardless';
  paymentProviderId?: string;
  vat?: number;
  documentLocale?: string;
}

export interface Customer {
  customerId: string;
  name: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
  phoneNumber?: string;
  url?: string;
  legalName?: string;
  legalNumber?: string;
  taxIdentificationNumber?: string;
  currency?: string;
  timezone?: string;
  externalId?: string;
  metadata?: CustomerMetadata;
  billingConfiguration?: BillingConfiguration;
}

export interface CustomerCreateInput extends Omit<Customer, 'customerId'> {
  customerId: string;
}

export interface CustomerUpdateInput extends Partial<Omit<Customer, 'customerId'>> {
  customerId: string;
}

export interface CustomerResponse {
  customer: Customer;
}

export interface CustomersResponse {
  customers: Customer[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}
