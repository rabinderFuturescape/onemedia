/**
 * Plan Model
 * 
 * Represents a billing plan in the Lago system.
 * Plans define the pricing structure for subscriptions.
 */

export type PlanInterval = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface ChargeProperties {
  groupedBy?: string[];
  invoiceable?: boolean;
  prorated?: boolean;
  minAmountCents?: number;
}

export interface GraduatedRangeCharge {
  fromValue: number;
  toValue: number | null;
  flatAmount: number;
  perUnitAmount: number;
}

export interface GraduatedPercentageRangeCharge {
  fromValue: number;
  toValue: number | null;
  rate: number;
  flatAmount: number;
}

export interface VolumeRangeCharge {
  fromValue: number;
  toValue: number | null;
  perUnitAmount: number;
}

export interface PackageCharge {
  packageSize: number;
  amount: number;
}

export interface PercentageCharge {
  rate: number;
  fixedAmount?: number;
  freeUnitsPerEvents?: number;
  freeUnitsPerTotalAggregation?: number;
}

export interface StandardCharge {
  amount: number;
}

export type ChargeModel = 
  | 'standard'
  | 'graduated'
  | 'graduated_percentage'
  | 'package'
  | 'percentage'
  | 'volume';

export interface Charge {
  chargeModel: ChargeModel;
  billableMetricId: string;
  invoiceDisplayName?: string;
  minAmountCents?: number;
  properties?: ChargeProperties;
  groupProperties?: any[];
  taxes?: string[];
  
  // Model-specific properties
  amount?: number; // For standard
  graduatedRanges?: GraduatedRangeCharge[]; // For graduated
  graduatedPercentageRanges?: GraduatedPercentageRangeCharge[]; // For graduated_percentage
  packageSize?: number; // For package
  packageAmount?: number; // For package
  rate?: number; // For percentage
  fixedAmount?: number; // For percentage
  freeUnitsPerEvents?: number; // For percentage
  freeUnitsPerTotalAggregation?: number; // For percentage
  volumeRanges?: VolumeRangeCharge[]; // For volume
}

export interface Plan {
  planId: string;
  name: string;
  displayName?: string;
  code: string;
  interval: PlanInterval;
  description?: string;
  amountCents: number;
  amountCurrency: string;
  trialPeriod?: number;
  payInAdvance?: boolean;
  billChargesMonthly?: boolean;
  taxes?: string[];
  charges?: Charge[];
  minimumCommitment?: {
    amountCents: number;
    invoiceDisplayName?: string;
    taxes?: string[];
  };
}

export interface PlanCreateInput extends Plan {}

export interface PlanUpdateInput extends Partial<Omit<Plan, 'planId'>> {
  planId: string;
}

export interface PlanResponse {
  plan: Plan;
}

export interface PlansResponse {
  plans: Plan[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}
