/**
 * Billable Metric Service
 * 
 * This service provides methods to manage billable metrics in the Lago billing system.
 */

import { LagoApiService } from './lago-api.service';
import { 
  BillableMetric, 
  BillableMetricCreateInput, 
  BillableMetricUpdateInput, 
  BillableMetricResponse, 
  BillableMetricsResponse 
} from '../models/billable-metric.model';

export class BillableMetricService {
  private apiService: LagoApiService;

  /**
   * Create a new billable metric service instance
   * 
   * @param apiService - The Lago API service
   */
  constructor(apiService: LagoApiService) {
    this.apiService = apiService;
  }

  /**
   * Create a new billable metric
   * 
   * @param billableMetric - The billable metric data
   * @returns The created billable metric
   */
  public async createBillableMetric(billableMetric: BillableMetricCreateInput): Promise<BillableMetric> {
    const response = await this.apiService.post<BillableMetricResponse>('/billable_metrics', {
      billable_metric: billableMetric,
    });
    return response.billableMetric;
  }

  /**
   * Get a billable metric by ID
   * 
   * @param billableMetricId - The billable metric ID
   * @returns The billable metric
   */
  public async getBillableMetric(billableMetricId: string): Promise<BillableMetric> {
    const response = await this.apiService.get<BillableMetricResponse>(`/billable_metrics/${billableMetricId}`);
    return response.billableMetric;
  }

  /**
   * Update a billable metric
   * 
   * @param billableMetric - The billable metric data to update
   * @returns The updated billable metric
   */
  public async updateBillableMetric(billableMetric: BillableMetricUpdateInput): Promise<BillableMetric> {
    const { billableMetricId, ...billableMetricData } = billableMetric;
    const response = await this.apiService.put<BillableMetricResponse>(`/billable_metrics/${billableMetricId}`, {
      billable_metric: billableMetricData,
    });
    return response.billableMetric;
  }

  /**
   * Delete a billable metric
   * 
   * @param billableMetricId - The billable metric ID
   */
  public async deleteBillableMetric(billableMetricId: string): Promise<void> {
    await this.apiService.delete(`/billable_metrics/${billableMetricId}`);
  }

  /**
   * Get all billable metrics
   * 
   * @param page - The page number
   * @param perPage - The number of items per page
   * @returns The billable metrics
   */
  public async getBillableMetrics(page: number = 1, perPage: number = 20): Promise<BillableMetricsResponse> {
    return this.apiService.get<BillableMetricsResponse>('/billable_metrics', {
      page,
      per_page: perPage,
    });
  }

  /**
   * Find a billable metric by code
   * 
   * @param code - The billable metric code
   * @returns The billable metric or null if not found
   */
  public async findBillableMetricByCode(code: string): Promise<BillableMetric | null> {
    try {
      const response = await this.apiService.get<BillableMetricsResponse>('/billable_metrics', {
        code,
      });
      
      if (response.billableMetrics.length > 0) {
        return response.billableMetrics[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error finding billable metric by code:', error);
      return null;
    }
  }

  /**
   * Check if a billable metric exists
   * 
   * @param billableMetricId - The billable metric ID
   * @returns True if the billable metric exists
   */
  public async billableMetricExists(billableMetricId: string): Promise<boolean> {
    try {
      await this.getBillableMetric(billableMetricId);
      return true;
    } catch (error) {
      return false;
    }
  }
}
