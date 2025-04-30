/**
 * Billable Metric Model
 * 
 * Represents a billable metric in the Lago billing system.
 * Billable metrics are used to track usage that can be billed.
 */

export type AggregationType = 'count_agg' | 'sum_agg' | 'max_agg' | 'unique_count_agg' | 'weighted_sum_agg';

export interface FieldMapping {
  field_name: string;
  values_mapping?: Record<string, number>;
}

export interface BillableMetric {
  billableMetricId?: string;
  name: string;
  code: string;
  description?: string;
  aggregationType: AggregationType;
  fieldName?: string;
  fieldMapping?: FieldMapping;
  recurring?: boolean;
  createdAt?: string;
  updatedAt?: string;
  group?: {
    key: string;
    values?: string[];
  };
}

export interface BillableMetricCreateInput extends Omit<BillableMetric, 'billableMetricId' | 'createdAt' | 'updatedAt'> {}

export interface BillableMetricUpdateInput extends Partial<Omit<BillableMetric, 'billableMetricId' | 'createdAt' | 'updatedAt'>> {
  billableMetricId: string;
}

export interface BillableMetricResponse {
  billableMetric: BillableMetric;
}

export interface BillableMetricsResponse {
  billableMetrics: BillableMetric[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}
