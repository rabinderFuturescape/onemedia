/**
 * Usage Controller
 * 
 * This controller provides API endpoints for tracking usage in the billing system.
 */

import { BillingService } from '../services/billing.service';
import { EventCreateInput, EventBatchInput } from '../models/event.model';

export class UsageController {
  private billingService: BillingService;

  /**
   * Create a new usage controller instance
   * 
   * @param billingService - The billing service
   */
  constructor(billingService: BillingService) {
    this.billingService = billingService;
  }

  /**
   * Track usage for a customer
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async trackUsage(req: any, res: any): Promise<void> {
    try {
      const { customerId, metricCode } = req.params;
      const { properties, subscriptionId } = req.body;
      
      const success = await this.billingService.trackUsage(
        customerId,
        metricCode,
        properties || {},
        subscriptionId
      );
      
      if (success) {
        res.status(201).json({ success: true });
      } else {
        res.status(400).json({ success: false, error: 'Failed to track usage' });
      }
    } catch (error) {
      console.error('Error tracking usage:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Track batch usage
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async trackBatchUsage(req: any, res: any): Promise<void> {
    try {
      const events = req.body.events;
      
      if (!Array.isArray(events)) {
        res.status(400).json({ success: false, error: 'Events must be an array' });
        return;
      }
      
      const successCount = await this.billingService.trackBatchUsage(events);
      
      res.status(201).json({
        success: successCount > 0,
        totalEvents: events.length,
        successCount,
        failureCount: events.length - successCount,
      });
    } catch (error) {
      console.error('Error tracking batch usage:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Create a single event
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async createEvent(req: any, res: any): Promise<void> {
    try {
      const eventData: EventCreateInput = req.body.event;
      const response = await this.billingService.getEventService().createEvent(eventData);
      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Create multiple events in a batch
   * 
   * @param req - The request object
   * @param res - The response object
   */
  public async createEvents(req: any, res: any): Promise<void> {
    try {
      const eventsData: EventBatchInput = req.body;
      const response = await this.billingService.getEventService().createEvents(eventsData);
      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating events:', error);
      res.status(400).json({ error: error.message });
    }
  }
}
