import { AppData, TenantUnit, SubMeter, BillingCycle } from '../types';

export const initialUnits: TenantUnit[] = [
  {
    id: 'unit-101',
    unitNumber: 'Unit 101 (Ground Floor)',
    tenantName: 'Juan Dela Cruz',
    contactNumber: '0917-123-4567',
    email: 'juan.delacruz@example.com',
    isOccupied: true,
    notes: '2-bedroom, aircon unit',
  },
  {
    id: 'unit-102',
    unitNumber: 'Unit 102 (Ground Floor)',
    tenantName: 'Maria Santos',
    contactNumber: '0918-987-6543',
    email: 'maria.santos@example.com',
    isOccupied: true,
    notes: 'Studio unit',
  },
  {
    id: 'unit-201',
    unitNumber: 'Unit 201 (2nd Floor)',
    tenantName: 'Carlos Garcia',
    contactNumber: '0922-333-4455',
    email: 'carlos.garcia@example.com',
    isOccupied: true,
    notes: '1-bedroom with inverter ref',
  },
  {
    id: 'unit-202',
    unitNumber: 'Unit 202 (2nd Floor)',
    tenantName: 'Ana Reyes',
    contactNumber: '0999-555-6677',
    email: 'ana.reyes@example.com',
    isOccupied: true,
    notes: 'Studio with induction cooker',
  },
];

export const initialMeters: SubMeter[] = [
  {
    id: 'meter-101',
    name: 'Unit 101 Sub-Meter',
    unitId: 'unit-101',
    type: 'tenant',
    meterNumber: 'SM-2024-001',
    multiplier: 1.0,
    initialReading: 1240.5,
  },
  {
    id: 'meter-102',
    name: 'Unit 102 Sub-Meter',
    unitId: 'unit-102',
    type: 'tenant',
    meterNumber: 'SM-2024-002',
    multiplier: 1.0,
    initialReading: 890.2,
  },
  {
    id: 'meter-201',
    name: 'Unit 201 Sub-Meter',
    unitId: 'unit-201',
    type: 'tenant',
    meterNumber: 'SM-2024-003',
    multiplier: 1.0,
    initialReading: 1530.0,
  },
  {
    id: 'meter-202',
    name: 'Unit 202 Sub-Meter',
    unitId: 'unit-202',
    type: 'tenant',
    meterNumber: 'SM-2024-004',
    multiplier: 1.0,
    initialReading: 675.8,
  },
  {
    id: 'meter-common-pump',
    name: 'Common Area & Water Pump',
    unitId: 'common',
    type: 'common',
    meterNumber: 'SM-COM-01',
    multiplier: 1.0,
    initialReading: 410.0,
  },
];

export const initialBillingCycles: BillingCycle[] = [
  {
    id: 'cycle-aug-2026',
    name: 'August 2026 Billing',
    createdAt: '2026-08-20T10:00:00Z',
    status: 'draft',
    mainBill: {
      billingMonth: '2026-08',
      periodFrom: '2026-07-15',
      periodTo: '2026-08-15',
      dueDate: '2026-08-28',
      totalAmountDue: 6450.75,
      totalMainKwh: 542.8,
      notes: 'Meralco August 2026 SOA - Main Account No. 1234567890',
    },
    readings: {
      'meter-101': { previous: 1240.5, present: 1410.5 }, // 170.0 kWh
      'meter-102': { previous: 890.2, present: 985.4 },   // 95.2 kWh
      'meter-201': { previous: 1530.0, present: 1695.0 }, // 165.0 kWh
      'meter-202': { previous: 675.8, present: 748.8 },   // 73.0 kWh
      'meter-common-pump': { previous: 410.0, present: 435.0 }, // 25.0 kWh common
      // Total Submeters: 170 + 95.2 + 165 + 73 + 25 = 528.2 kWh
      // Residual line loss: 542.8 - 528.2 = 14.6 kWh
    },
    additionalCharges: {
      'unit-101': [
        { id: 'c-1', name: 'Water Sub-meter', amount: 350.0, type: 'water' },
        { id: 'c-2', name: 'Garbage Share', amount: 50.0, type: 'garbage' },
      ],
      'unit-102': [
        { id: 'c-3', name: 'Water Sub-meter', amount: 220.0, type: 'water' },
        { id: 'c-4', name: 'Garbage Share', amount: 50.0, type: 'garbage' },
      ],
      'unit-201': [
        { id: 'c-5', name: 'Water Sub-meter', amount: 310.0, type: 'water' },
        { id: 'c-6', name: 'Garbage Share', amount: 50.0, type: 'garbage' },
      ],
      'unit-202': [
        { id: 'c-7', name: 'Water Sub-meter', amount: 180.0, type: 'water' },
        { id: 'c-8', name: 'Garbage Share', amount: 50.0, type: 'garbage' },
      ],
    },
    commonAreaAllocMethod: 'equal',
  },
];

export const initialAppData: AppData = {
  units: initialUnits,
  meters: initialMeters,
  billingCycles: initialBillingCycles,
  activeCycleId: 'cycle-aug-2026',
  landlordInfo: {
    propertyName: 'Sunrise Residences Apartment',
    landlordName: 'Property Admin',
    contactNumber: '0917-888-9999',
    paymentDetails: 'GCash: 0917-888-9999 (Mark H.) | BDO Savings: 0012-3456-7890',
  },
};
