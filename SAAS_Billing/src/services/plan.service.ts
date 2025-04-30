/**
 * Plan Service
 * 
 * This service provides methods to manage billing plans in the Lago system.
 */

import { LagoApiService } from './lago-api.service';
import { 
  Plan, 
  PlanCreateInput, 
  PlanUpdateInput, 
  PlanResponse, 
  PlansResponse 
} from '../models/plan.model';

export class PlanService {
  private apiService: LagoApiService;

  /**
   * Create a new plan service instance
   * 
   * @param apiService - The Lago API service
   */
  constructor(apiService: LagoApiService) {
    this.apiService = apiService;
  }

  /**
   * Create a new plan
   * 
   * @param plan - The plan data
   * @returns The created plan
   */
  public async createPlan(plan: PlanCreateInput): Promise<Plan> {
    const response = await this.apiService.post<PlanResponse>('/plans', {
      plan,
    });
    return response.plan;
  }

  /**
   * Get a plan by ID
   * 
   * @param planId - The plan ID
   * @returns The plan
   */
  public async getPlan(planId: string): Promise<Plan> {
    const response = await this.apiService.get<PlanResponse>(`/plans/${planId}`);
    return response.plan;
  }

  /**
   * Update a plan
   * 
   * @param plan - The plan data to update
   * @returns The updated plan
   */
  public async updatePlan(plan: PlanUpdateInput): Promise<Plan> {
    const { planId, ...planData } = plan;
    const response = await this.apiService.put<PlanResponse>(`/plans/${planId}`, {
      plan: planData,
    });
    return response.plan;
  }

  /**
   * Delete a plan
   * 
   * @param planId - The plan ID
   */
  public async deletePlan(planId: string): Promise<void> {
    await this.apiService.delete(`/plans/${planId}`);
  }

  /**
   * Get all plans
   * 
   * @param page - The page number
   * @param perPage - The number of items per page
   * @returns The plans
   */
  public async getPlans(page: number = 1, perPage: number = 20): Promise<PlansResponse> {
    return this.apiService.get<PlansResponse>('/plans', {
      page,
      per_page: perPage,
    });
  }

  /**
   * Find a plan by code
   * 
   * @param code - The plan code
   * @returns The plan or null if not found
   */
  public async findPlanByCode(code: string): Promise<Plan | null> {
    try {
      const response = await this.apiService.get<PlansResponse>('/plans', {
        code,
      });
      
      if (response.plans.length > 0) {
        return response.plans[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error finding plan by code:', error);
      return null;
    }
  }

  /**
   * Check if a plan exists
   * 
   * @param planId - The plan ID
   * @returns True if the plan exists
   */
  public async planExists(planId: string): Promise<boolean> {
    try {
      await this.getPlan(planId);
      return true;
    } catch (error) {
      return false;
    }
  }
}
