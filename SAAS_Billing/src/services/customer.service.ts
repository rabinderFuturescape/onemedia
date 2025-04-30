/**
 * Customer Service
 * 
 * This service provides methods to manage customers in the Lago billing system.
 */

import { LagoApiService } from './lago-api.service';
import { 
  Customer, 
  CustomerCreateInput, 
  CustomerUpdateInput, 
  CustomerResponse, 
  CustomersResponse 
} from '../models/customer.model';

export class CustomerService {
  private apiService: LagoApiService;

  /**
   * Create a new customer service instance
   * 
   * @param apiService - The Lago API service
   */
  constructor(apiService: LagoApiService) {
    this.apiService = apiService;
  }

  /**
   * Create a new customer
   * 
   * @param customer - The customer data
   * @returns The created customer
   */
  public async createCustomer(customer: CustomerCreateInput): Promise<Customer> {
    const response = await this.apiService.post<CustomerResponse>('/customers', {
      customer,
    });
    return response.customer;
  }

  /**
   * Get a customer by ID
   * 
   * @param customerId - The customer ID
   * @returns The customer
   */
  public async getCustomer(customerId: string): Promise<Customer> {
    const response = await this.apiService.get<CustomerResponse>(`/customers/${customerId}`);
    return response.customer;
  }

  /**
   * Update a customer
   * 
   * @param customer - The customer data to update
   * @returns The updated customer
   */
  public async updateCustomer(customer: CustomerUpdateInput): Promise<Customer> {
    const { customerId, ...customerData } = customer;
    const response = await this.apiService.put<CustomerResponse>(`/customers/${customerId}`, {
      customer: customerData,
    });
    return response.customer;
  }

  /**
   * Delete a customer
   * 
   * @param customerId - The customer ID
   */
  public async deleteCustomer(customerId: string): Promise<void> {
    await this.apiService.delete(`/customers/${customerId}`);
  }

  /**
   * Get all customers
   * 
   * @param page - The page number
   * @param perPage - The number of items per page
   * @returns The customers
   */
  public async getCustomers(page: number = 1, perPage: number = 20): Promise<CustomersResponse> {
    return this.apiService.get<CustomersResponse>('/customers', {
      page,
      per_page: perPage,
    });
  }

  /**
   * Find customers by external ID
   * 
   * @param externalId - The external ID
   * @returns The customers
   */
  public async findCustomerByExternalId(externalId: string): Promise<Customer | null> {
    try {
      const response = await this.apiService.get<CustomersResponse>('/customers', {
        external_id: externalId,
      });
      
      if (response.customers.length > 0) {
        return response.customers[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error finding customer by external ID:', error);
      return null;
    }
  }

  /**
   * Check if a customer exists
   * 
   * @param customerId - The customer ID
   * @returns True if the customer exists
   */
  public async customerExists(customerId: string): Promise<boolean> {
    try {
      await this.getCustomer(customerId);
      return true;
    } catch (error) {
      return false;
    }
  }
}
