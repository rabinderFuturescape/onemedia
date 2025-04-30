/**
 * Invoice Controller
 * 
 * This controller provides API endpoints for managing invoices in the billing system.
 */

import { BillingService } from '../services/billing.service';
import { InvoiceCreateInput, InvoiceUpdateInput } from '../models/invoice.model';

export class InvoiceController {
  private billingService: BillingService;

  /**
   * Create a new invoice controller instance
   * 
   * @param billingService - The billing service
   */
  constructor(billingService: BillingService) {
    this.billingService = billingService;
  }

  /**
   * Create a new invoice
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async createInvoice(req: any, res: any): Promise<void> {
    try {
      const invoiceData: InvoiceCreateInput = req.body;
      const invoice = await this.billingService.getInvoiceService().createInvoice(invoiceData);
      res.status(201).json({ invoice });
    } catch (error) {
      console.error('Error creating invoice:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get an invoice by ID
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async getInvoice(req: any, res: any): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const invoice = await this.billingService.getInvoiceService().getInvoice(invoiceId);
      res.status(200).json({ invoice });
    } catch (error) {
      console.error('Error getting invoice:', error);
      res.status(404).json({ error: 'Invoice not found' });
    }
  }

  /**
   * Update an invoice
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async updateInvoice(req: any, res: any): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const invoiceData: InvoiceUpdateInput = {
        invoiceId,
        ...req.body,
      };
      const invoice = await this.billingService.getInvoiceService().updateInvoice(invoiceData);
      res.status(200).json({ invoice });
    } catch (error) {
      console.error('Error updating invoice:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Finalize an invoice
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async finalizeInvoice(req: any, res: any): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const invoice = await this.billingService.getInvoiceService().finalizeInvoice(invoiceId);
      res.status(200).json({ invoice });
    } catch (error) {
      console.error('Error finalizing invoice:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Void an invoice
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async voidInvoice(req: any, res: any): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const invoice = await this.billingService.getInvoiceService().voidInvoice(invoiceId);
      res.status(200).json({ invoice });
    } catch (error) {
      console.error('Error voiding invoice:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Download an invoice PDF
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async downloadInvoice(req: any, res: any): Promise<void> {
    try {
      const { invoiceId } = req.params;
      const fileUrl = await this.billingService.getInvoiceService().downloadInvoice(invoiceId);
      res.status(200).json({ fileUrl });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get all invoices
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async getInvoices(req: any, res: any): Promise<void> {
    try {
      const { page = 1, perPage = 20, customerId, status } = req.query;
      const invoices = await this.billingService.getInvoiceService().getInvoices(
        parseInt(page, 10),
        parseInt(perPage, 10),
        customerId,
        status
      );
      res.status(200).json(invoices);
    } catch (error) {
      console.error('Error getting invoices:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get all invoices for a customer
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async getCustomerInvoices(req: any, res: any): Promise<void> {
    try {
      const { customerId } = req.params;
      const { page = 1, perPage = 20 } = req.query;
      const invoices = await this.billingService.getInvoiceService().getCustomerInvoices(
        customerId,
        parseInt(page, 10),
        parseInt(perPage, 10)
      );
      res.status(200).json(invoices);
    } catch (error) {
      console.error('Error getting customer invoices:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Create a one-time invoice for a customer
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async createOneTimeInvoice(req: any, res: any): Promise<void> {
    try {
      const { customerId } = req.params;
      const { currency, fees, metadata } = req.body;
      
      const invoice = await this.billingService.createOneTimeInvoice(
        customerId,
        currency,
        fees,
        metadata
      );
      
      res.status(201).json({ invoice });
    } catch (error) {
      console.error('Error creating one-time invoice:', error);
      res.status(400).json({ error: error.message });
    }
  }
}
