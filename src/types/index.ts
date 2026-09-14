export type MeterType = 'tenant' | 'common' | 'main_line';

export interface TenantUnit {
  id: string;
  unitNumber: string; // e.g., "Unit 1 (Main Line)", "Unit 2"
  tenantName: string;
  contactNumber?: string;
  email?: string;
  isOccupied: boolean;
  notes?: string;
  isMainLine?: boolean; // true if this unit uses the main line remainder
}

export interface SubMeter {
  id: string;
  name: string; // e.g., "Unit 2 Meter", "Main Line"
  unitId: string | 'common';
  type: MeterType;
  meterNumber?: string;
  multiplier: number;
  initialReading: number;
}

export interface AdditionalChargeItem {
  id: string;
  name: string; // e.g., "Water Sub-meter", "Garbage Collection", "Previous Unpaid Balance", "Advance Payment"
  amount: number; // positive for charges, negative for discounts/advances
  type: 'water' | 'garbage' | 'maintenance' | 'arrears' | 'discount' | 'other';
}

export interface MainMeralcoBill {
  billingMonth: string; // "2026-08"
  periodFrom: string;
  periodTo: string;
  dueDate: string;
  totalAmountDue: number; // In PHP (e.g. 6450.75)
  totalMainKwh: number; // In kWh (e.g. 542.8)
  billPhotoUrl?: string; // Base64 or Object URL
  notes?: string;
}

export interface MeterReadingInput {
  subMeterId: string;
  previousReading: number;
  presentReading: number;
}

export interface TenantCalculationResult {
  unitId: string;
  unitNumber: string;
  tenantName: string;
  contactNumber?: string;
  email?: string;
  isOccupied: boolean;
  isMainLine?: boolean;
  meterName: string;
  meterNumber?: string;
  previousReading: number;
  presentReading: number;
  multiplier: number;
  directKwh: number;
  directSharePercent: number; // (directKwh / totalTenantDirectKwh) * 100
  commonAreaShareKwh: number;
  lossShareKwh: number;
  effectiveKwh: number;
  effectiveRate: number; // In PHP/kWh
  electricityAmount: number; // In PHP
  reconciliationDiff: number; // Adjusts 1-2 centavos to match Meralco bill exactly
  additionalCharges: AdditionalChargeItem[];
  additionalTotal: number;
  totalAmountDue: number; // electricityAmount + additionalTotal
}

export interface CommonAreaBreakdown {
  meterId: string;
  name: string;
  previousReading: number;
  presentReading: number;
  multiplier: number;
  kwh: number;
  cost: number;
  sharePerTenantKwh: number;
  sharePerTenantCost: number;
}

export interface CycleCalculationSummary {
  effectiveBaseRate: number;
  totalTenantDirectKwh: number;
  totalCommonAreaKwh: number;
  totalSubMeterKwh: number;
  totalMainKwh: number;
  residualLossKwh: number;
  residualLossPercent: number;
  residualLossCost: number;
  totalElectricityBilled: number;
  meralcoTotalAmount: number;
  totalAdditionalCharges: number;
  grandTotalBilled: number;
  isReconciled: boolean;
  tenantResults: TenantCalculationResult[];
  commonAreaBreakdown: CommonAreaBreakdown[];
}

export type PaymentStatus = 'unpaid' | 'paid' | 'partial';
export type PaymentMethod = 'gcash' | 'maya' | 'bank_transfer' | 'cash' | 'other';

export interface TenantPayment {
  status: PaymentStatus;
  amountPaid: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  paidAt?: string;
  notes?: string;
}

export interface WaterReadingRecord {
  previous: number;
  present: number;
  ratePerCuM: number;
  amount: number;
}

export interface BillingCycle {
  id: string;
  name: string; // e.g. "August 2026 Billing"
  createdAt: string;
  status: 'draft' | 'finalized';
  mainBill: MainMeralcoBill;
  readings: Record<string, { previous: number; present: number }>;
  additionalCharges: Record<string, AdditionalChargeItem[]>;
  calculationSummary?: CycleCalculationSummary;
  commonAreaAllocMethod: 'equal' | 'proportional';
  payments?: Record<string, TenantPayment>;
  waterReadings?: Record<string, WaterReadingRecord>;
}

export interface AppData {
  units: TenantUnit[];
  meters: SubMeter[];
  billingCycles: BillingCycle[];
  activeCycleId: string | null;
  landlordInfo: {
    propertyName: string;
    landlordName: string;
    contactNumber: string;
    email?: string;
    propertyAddress?: string;
    paymentDetails: string; // e.g. "GCash: 0917-xxx-xxxx / BDO: xxxx-xxxx"
    notes?: string;
  };
}
