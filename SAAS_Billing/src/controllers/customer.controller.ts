/**
 * Customer Controller
 * 
 * This controller provides API endpoints for managing customers in the billing system.
 */

import { BillingService } from '../services/billing.service';
import { CustomerCreateInput, CustomerUpdateInput } from '../models/customer.model';

export class CustomerController {
  private billingService: BillingService;

  /**
   * Create a new customer controller instance
   * 
   * @param billingService - The billing service
   */
  constructor(billingService: BillingService) {
    this.billingService = billingService;
  }

  /**
   * Create a new customer
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async createCustomer(req: any, res: any): Promise<void> {
    try {
      const customerData: CustomerCreateInput = req.body;
      const customer = await this.billingService.getCustomerService().createCustomer(customerData);
      res.status(201).json({ customer });
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get a customer by ID
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async getCustomer(req: any, res: any): Promise<void> {
    try {
      const { customerId } = req.params;
      const customer = await this.billingService.getCustomerService().getCustomer(customerId);
      res.status(200).json({ customer });
    } catch (error) {
      console.error('Error getting customer:', error);
      res.status(404).json({ error: 'Customer not found' });
    }
  }

  /**
   * Update a customer
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async updateCustomer(req: any, res: any): Promise<void> {
    try {
      const { customerId } = req.params;
      const customerData: CustomerUpdateInput = {
        customerId,
        ...req.body,
      };
      const customer = await this.billingService.getCustomerService().updateCustomer(customerData);
      res.status(200).json({ customer });
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Delete a customer
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async deleteCustomer(req: any, res: any): Promise<void> {
    try {
      const { customerId } = req.params;
      await this.billingService.getCustomerService().deleteCustomer(customerId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting customer:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get all customers
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async getCustomers(req: any, res: any): Promise<void> {
    try {
      const { page = 1, perPage = 20 } = req.query;
      const customers = await this.billingService.getCustomerService().getCustomers(
        parseInt(page, 10),
        parseInt(perPage, 10)
      );
      res.status(200).json(customers);
    } catch (error) {
      console.error('Error getting customers:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Sync a customer (create or update)
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async syncCustomer(req: any, res: any): Promise<void> {
    try {
      const customerData: CustomerCreateInput = req.body;
      const customer = await this.billingService.syncCustomer(customerData);
      res.status(200).json({ customer });
    } catch (error) {
      console.error('Error syncing customer:', error);
      res.status(400).json({ error: error.message });
    }
  }
}
