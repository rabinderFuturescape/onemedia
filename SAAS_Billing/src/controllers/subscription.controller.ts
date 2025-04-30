/**
 * Subscription Controller
 * 
 * This controller provides API endpoints for managing subscriptions in the billing system.
 */

import { BillingService } from '../services/billing.service';
import { SubscriptionCreateInput, SubscriptionUpdateInput } from '../models/subscription.model';

export class SubscriptionController {
  private billingService: BillingService;

  /**
   * Create a new subscription controller instance
   * 
   * @param billingService - The billing service
   */
  constructor(billingService: BillingService) {
    this.billingService = billingService;
  }

  /**
   * Create a new subscription
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async createSubscription(req: any, res: any): Promise<void> {
    try {
      const subscriptionData: SubscriptionCreateInput = req.body;
      const subscription = await this.billingService.getSubscriptionService().createSubscription(subscriptionData);
      res.status(201).json({ subscription });
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get a subscription by ID
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async getSubscription(req: any, res: any): Promise<void> {
    try {
      const { subscriptionId } = req.params;
      const subscription = await this.billingService.getSubscriptionService().getSubscription(subscriptionId);
      res.status(200).json({ subscription });
    } catch (error) {
      console.error('Error getting subscription:', error);
      res.status(404).json({ error: 'Subscription not found' });
    }
  }

  /**
   * Update a subscription
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async updateSubscription(req: any, res: any): Promise<void> {
    try {
      const { subscriptionId } = req.params;
      const subscriptionData: SubscriptionUpdateInput = {
        subscriptionId,
        ...req.body,
      };
      const subscription = await this.billingService.getSubscriptionService().updateSubscription(subscriptionData);
      res.status(200).json({ subscription });
    } catch (error) {
      console.error('Error updating subscription:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Terminate a subscription
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async terminateSubscription(req: any, res: any): Promise<void> {
    try {
      const { subscriptionId } = req.params;
      const subscription = await this.billingService.getSubscriptionService().terminateSubscription({
        subscriptionId,
      });
      res.status(200).json({ subscription });
    } catch (error) {
      console.error('Error terminating subscription:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Cancel a subscription
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async cancelSubscription(req: any, res: any): Promise<void> {
    try {
      const { subscriptionId } = req.params;
      const subscription = await this.billingService.getSubscriptionService().cancelSubscription({
        subscriptionId,
      });
      res.status(200).json({ subscription });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get all subscriptions
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async getSubscriptions(req: any, res: any): Promise<void> {
    try {
      const { page = 1, perPage = 20, customerId, planId, status } = req.query;
      const subscriptions = await this.billingService.getSubscriptionService().getSubscriptions(
        parseInt(page, 10),
        parseInt(perPage, 10),
        customerId,
        planId,
        status
      );
      res.status(200).json(subscriptions);
    } catch (error) {
      console.error('Error getting subscriptions:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get all subscriptions for a customer
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async getCustomerSubscriptions(req: any, res: any): Promise<void> {
    try {
      const { customerId } = req.params;
      const { page = 1, perPage = 20 } = req.query;
      const subscriptions = await this.billingService.getSubscriptionService().getCustomerSubscriptions(
        customerId,
        parseInt(page, 10),
        parseInt(perPage, 10)
      );
      res.status(200).json(subscriptions);
    } catch (error) {
      console.error('Error getting customer subscriptions:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Subscribe a customer to a plan
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async subscribeCustomerToPlan(req: any, res: any): Promise<void> {
    try {
      const { customerId, planId } = req.params;
      const options = req.body;
      const subscription = await this.billingService.subscribeCustomerToPlan(customerId, planId, options);
      res.status(201).json({ subscription });
    } catch (error) {
      console.error('Error subscribing customer to plan:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get customer subscription status
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async getCustomerSubscriptionStatus(req: any, res: any): Promise<void> {
    try {
      const { customerId } = req.params;
      const status = await this.billingService.getCustomerSubscriptionStatus(customerId);
      res.status(200).json(status);
    } catch (error) {
      console.error('Error getting customer subscription status:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Cancel all active subscriptions for a customer
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async cancelAllCustomerSubscriptions(req: any, res: any): Promise<void> {
    try {
      const { customerId } = req.params;
      const count = await this.billingService.cancelAllCustomerSubscriptions(customerId);
      res.status(200).json({ canceledCount: count });
    } catch (error) {
      console.error('Error canceling customer subscriptions:', error);
      res.status(400).json({ error: error.message });
    }
  }
}
