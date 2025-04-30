/**
 * Billing Service
 * 
 * This service provides a unified interface to the Lago billing system.
 * It combines all the individual services into a single service.
 */

import { LagoApiService } from './lago-api.service';
import { CustomerService } from './customer.service';
import { PlanService } from './plan.service';
import { SubscriptionService } from './subscription.service';
import { BillableMetricService } from './billable-metric.service';
import { EventService } from './event.service';
import { InvoiceService } from './invoice.service';

import { LagoConfig } from '../config/lago.config';
import { Customer, CustomerCreateInput, CustomerUpdateInput } from '../models/customer.model';
import { Plan, PlanCreateInput, PlanUpdateInput } from '../models/plan.model';
import { Subscription, SubscriptionCreateInput, SubscriptionUpdateInput } from '../models/subscription.model';
import { BillableMetric, BillableMetricCreateInput } from '../models/billable-metric.model';
import { Invoice, InvoiceCreateInput } from '../models/invoice.model';

export class BillingService {
  private apiService: LagoApiService;
  private customerService: CustomerService;
  private planService: PlanService;
  private subscriptionService: SubscriptionService;
  private billableMetricService: BillableMetricService;
  private eventService: EventService;
  private invoiceService: InvoiceService;

  /**
   * Create a new billing service instance
   * 
   * @param config - Optional configuration overrides
   */
  constructor(config?: Partial<LagoConfig>) {
    this.apiService = new LagoApiService(config);
    this.customerService = new CustomerService(this.apiService);
    this.planService = new PlanService(this.apiService);
    this.subscriptionService = new SubscriptionService(this.apiService);
    this.billableMetricService = new BillableMetricService(this.apiService);
    this.eventService = new EventService(this.apiService);
    this.invoiceService = new InvoiceService(this.apiService);
  }

  /**
   * Get the customer service
   * 
   * @returns The customer service
   */
  public getCustomerService(): CustomerService {
    return this.customerService;
  }

  /**
   * Get the plan service
   * 
   * @returns The plan service
   */
  public getPlanService(): PlanService {
    return this.planService;
  }

  /**
   * Get the subscription service
   * 
   * @returns The subscription service
   */
  public getSubscriptionService(): SubscriptionService {
    return this.subscriptionService;
  }

  /**
   * Get the billable metric service
   * 
   * @returns The billable metric service
   */
  public getBillableMetricService(): BillableMetricService {
    return this.billableMetricService;
  }

  /**
   * Get the event service
   * 
   * @returns The event service
   */
  public getEventService(): EventService {
    return this.eventService;
  }

  /**
   * Get the invoice service
   * 
   * @returns The invoice service
   */
  public getInvoiceService(): InvoiceService {
    return this.invoiceService;
  }

  /**
   * Create or update a customer
   * 
   * @param customer - The customer data
   * @returns The customer
   */
  public async syncCustomer(customer: CustomerCreateInput): Promise<Customer> {
    try {
      // Check if customer exists
      const existingCustomer = await this.customerService.findCustomerByExternalId(customer.externalId || customer.customerId);
      
      if (existingCustomer) {
        // Update existing customer
        return this.customerService.updateCustomer({
          customerId: existingCustomer.customerId,
          ...customer,
        });
      } else {
        // Create new customer
        return this.customerService.createCustomer(customer);
      }
    } catch (error) {
      console.error('Error syncing customer:', error);
      throw error;
    }
  }

  /**
   * Subscribe a customer to a plan
   * 
   * @param customerId - The customer ID
   * @param planId - The plan ID
   * @param options - Optional subscription options
   * @returns The subscription
   */
  public async subscribeCustomerToPlan(
    customerId: string,
    planId: string,
    options: {
      name?: string;
      externalId?: string;
      subscriptionDate?: string;
      billingTime?: 'calendar' | 'anniversary';
      endingAt?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<Subscription> {
    try {
      // Verify customer exists
      const customerExists = await this.customerService.customerExists(customerId);
      if (!customerExists) {
        throw new Error(`Customer ${customerId} does not exist`);
      }

      // Verify plan exists
      const planExists = await this.planService.planExists(planId);
      if (!planExists) {
        throw new Error(`Plan ${planId} does not exist`);
      }

      // Create subscription
      const subscription: SubscriptionCreateInput = {
        customerId,
        planId,
        ...options,
      };

      return this.subscriptionService.createSubscription(subscription);
    } catch (error) {
      console.error('Error subscribing customer to plan:', error);
      throw error;
    }
  }

  /**
   * Track usage for a customer
   * 
   * @param customerId - The customer ID
   * @param metricCode - The billable metric code
   * @param properties - The usage properties
   * @param subscriptionId - Optional subscription ID
   * @returns True if the usage was tracked successfully
   */
  public async trackUsage(
    customerId: string,
    metricCode: string,
    properties: Record<string, any> = {},
    subscriptionId?: string
  ): Promise<boolean> {
    return this.eventService.trackUsage(customerId, metricCode, properties, subscriptionId);
  }

  /**
   * Track batch usage for multiple customers or metrics
   * 
   * @param events - Array of usage events
   * @returns The number of successfully tracked events
   */
  public async trackBatchUsage(
    events: Array<{
      customerId: string;
      code: string;
      properties?: Record<string, any>;
      subscriptionId?: string;
    }>
  ): Promise<number> {
    return this.eventService.trackBatchUsage(events);
  }

  /**
   * Create a one-time invoice for a customer
   * 
   * @param customerId - The customer ID
   * @param currency - The invoice currency
   * @param fees - The invoice fees
   * @param metadata - Optional invoice metadata
   * @returns The created invoice
   */
  public async createOneTimeInvoice(
    customerId: string,
    currency: string,
    fees: Array<{
      addOnCode?: string;
      amountCents: number;
      description?: string;
      units?: number;
      taxCodes?: string[];
    }>,
    metadata?: Array<{ key: string; value: string }>
  ): Promise<Invoice> {
    try {
      // Verify customer exists
      const customerExists = await this.customerService.customerExists(customerId);
      if (!customerExists) {
        throw new Error(`Customer ${customerId} does not exist`);
      }

      // Create invoice
      const invoice: InvoiceCreateInput = {
        externalCustomerId: customerId,
        currency,
        fees,
        metadata,
      };

      return this.invoiceService.createInvoice(invoice);
    } catch (error) {
      console.error('Error creating one-time invoice:', error);
      throw error;
    }
  }

  /**
   * Get customer subscription status
   * 
   * @param customerId - The customer ID
   * @returns The customer's subscription status
   */
  public async getCustomerSubscriptionStatus(customerId: string): Promise<{
    hasActiveSubscription: boolean;
    subscriptions: Subscription[];
  }> {
    try {
      const response = await this.subscriptionService.getCustomerSubscriptions(customerId);
      const activeSubscriptions = response.subscriptions.filter(sub => sub.status === 'active');
      
      return {
        hasActiveSubscription: activeSubscriptions.length > 0,
        subscriptions: response.subscriptions,
      };
    } catch (error) {
      console.error('Error getting customer subscription status:', error);
      throw error;
    }
  }

  /**
   * Cancel all active subscriptions for a customer
   * 
   * @param customerId - The customer ID
   * @returns The number of canceled subscriptions
   */
  public async cancelAllCustomerSubscriptions(customerId: string): Promise<number> {
    try {
      const { subscriptions } = await this.getCustomerSubscriptionStatus(customerId);
      const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
      
      const cancelPromises = activeSubscriptions.map(subscription => 
        this.subscriptionService.cancelSubscription({ subscriptionId: subscription.id! })
      );
      
      const results = await Promise.allSettled(cancelPromises);
      return results.filter(result => result.status === 'fulfilled').length;
    } catch (error) {
      console.error('Error canceling customer subscriptions:', error);
      throw error;
    }
  }
}
