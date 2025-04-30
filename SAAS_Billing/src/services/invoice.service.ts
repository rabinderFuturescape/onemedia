/**
 * Invoice Service
 * 
 * This service provides methods to manage invoices in the Lago billing system.
 */

import { LagoApiService } from './lago-api.service';
import { 
  Invoice, 
  InvoiceCreateInput, 
  InvoiceUpdateInput, 
  InvoiceResponse, 
  InvoicesResponse 
} from '../models/invoice.model';

export class InvoiceService {
  private apiService: LagoApiService;

  /**
   * Create a new invoice service instance
   * 
   * @param apiService - The Lago API service
   */
  constructor(apiService: LagoApiService) {
    this.apiService = apiService;
  }

  /**
   * Create a new invoice
   * 
   * @param invoice - The invoice data
   * @returns The created invoice
   */
  public async createInvoice(invoice: InvoiceCreateInput): Promise<Invoice> {
    const response = await this.apiService.post<InvoiceResponse>('/invoices', {
      invoice,
    });
    return response.invoice;
  }

  /**
   * Get an invoice by ID
   * 
   * @param invoiceId - The invoice ID
   * @returns The invoice
   */
  public async getInvoice(invoiceId: string): Promise<Invoice> {
    const response = await this.apiService.get<InvoiceResponse>(`/invoices/${invoiceId}`);
    return response.invoice;
  }

  /**
   * Update an invoice
   * 
   * @param invoice - The invoice data to update
   * @returns The updated invoice
   */
  public async updateInvoice(invoice: InvoiceUpdateInput): Promise<Invoice> {
    const { invoiceId, ...invoiceData } = invoice;
    const response = await this.apiService.put<InvoiceResponse>(`/invoices/${invoiceId}`, {
      invoice: invoiceData,
    });
    return response.invoice;
  }

  /**
   * Finalize a draft invoice
   * 
   * @param invoiceId - The invoice ID
   * @returns The finalized invoice
   */
  public async finalizeInvoice(invoiceId: string): Promise<Invoice> {
    return this.updateInvoice({
      invoiceId,
      status: 'finalized',
    });
  }

  /**
   * Void an invoice
   * 
   * @param invoiceId - The invoice ID
   * @returns The voided invoice
   */
  public async voidInvoice(invoiceId: string): Promise<Invoice> {
    return this.updateInvoice({
      invoiceId,
      status: 'voided',
    });
  }

  /**
   * Download an invoice PDF
   * 
   * @param invoiceId - The invoice ID
   * @returns The invoice PDF URL
   */
  public async downloadInvoice(invoiceId: string): Promise<string> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice.fileUrl) {
      throw new Error('Invoice PDF not available');
    }
    return invoice.fileUrl;
  }

  /**
   * Get all invoices
   * 
   * @param page - The page number
   * @param perPage - The number of items per page
   * @param customerId - Optional customer ID to filter by
   * @param status - Optional status to filter by
   * @returns The invoices
   */
  public async getInvoices(
    page: number = 1, 
    perPage: number = 20,
    customerId?: string,
    status?: string
  ): Promise<InvoicesResponse> {
    const params: Record<string, any> = {
      page,
      per_page: perPage,
    };

    if (customerId) {
      params.external_customer_id = customerId;
    }

    if (status) {
      params.status = status;
    }

    return this.apiService.get<InvoicesResponse>('/invoices', params);
  }

  /**
   * Get all invoices for a customer
   * 
   * @param customerId - The customer ID
   * @param page - The page number
   * @param perPage - The number of items per page
   * @returns The customer's invoices
   */
  public async getCustomerInvoices(
    customerId: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<InvoicesResponse> {
    return this.getInvoices(page, perPage, customerId);
  }

  /**
   * Get all finalized invoices for a customer
   * 
   * @param customerId - The customer ID
   * @param page - The page number
   * @param perPage - The number of items per page
   * @returns The customer's finalized invoices
   */
  public async getFinalizedCustomerInvoices(
    customerId: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<InvoicesResponse> {
    return this.getInvoices(page, perPage, customerId, 'finalized');
  }
}
