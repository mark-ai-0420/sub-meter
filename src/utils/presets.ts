import { AppData, TenantUnit, SubMeter, BillingCycle } from '../types';

export interface BuildingPreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  unitCountText: string;
  generateData: () => AppData;
}

export const BUILDING_PRESETS: BuildingPreset[] = [
  {
    id: 'preset-4unit-mainline',
    name: '4 Units (3 Sub-Meters + 1 Main Line)',
    description: '1 Main Unit connected directly to the primary Meralco meter + 3 units with dedicated sub-meters (ATA-2, ATA-3, ATA-4).',
    badge: 'Popular Setup',
    unitCountText: '4 Units • 3 Sub-meters',
    generateData: (): AppData => {
      const units: TenantUnit[] = [
        {
          id: 'unit-1',
          unitNumber: 'Unit 1 (Main Line)',
          tenantName: 'Landlord / Main Unit',
          contactNumber: '0917-111-2222',
          email: 'landlord@example.com',
          isOccupied: true,
          isMainLine: true,
          notes: 'Connected directly to primary Meralco line (no sub-meter)',
        },
        {
          id: 'unit-2',
          unitNumber: 'Unit 2',
          tenantName: 'Tenant 2 (Rico)',
          contactNumber: '0917-222-3333',
          email: 'unit2@example.com',
          isOccupied: true,
          notes: 'Ground floor unit',
        },
        {
          id: 'unit-3',
          unitNumber: 'Unit 3',
          tenantName: 'Tenant 3 (Ehya)',
          contactNumber: '0917-333-4444',
          email: 'unit3@example.com',
          isOccupied: true,
          notes: '2nd floor unit',
        },
        {
          id: 'unit-4',
          unitNumber: 'Unit 4',
          tenantName: 'Tenant 4 (Ton)',
          contactNumber: '0917-444-5555',
          email: 'unit4@example.com',
          isOccupied: true,
          notes: '2nd floor studio',
        },
      ];

      const meters: SubMeter[] = [
        {
          id: 'meter-main',
          name: 'Main Line Connection',
          unitId: 'unit-1',
          type: 'main_line',
          meterNumber: 'MAIN',
          multiplier: 1.0,
          initialReading: 0,
        },
        {
          id: 'meter-2',
          name: 'Unit 2 Sub-Meter',
          unitId: 'unit-2',
          type: 'tenant',
          meterNumber: 'ATA-2',
          multiplier: 1.0,
          initialReading: 778.1,
        },
        {
          id: 'meter-3',
          name: 'Unit 3 Sub-Meter',
          unitId: 'unit-3',
          type: 'tenant',
          meterNumber: 'ATA-3',
          multiplier: 1.0,
          initialReading: 1381.4,
        },
        {
          id: 'meter-4',
          name: 'Unit 4 Sub-Meter',
          unitId: 'unit-4',
          type: 'tenant',
          meterNumber: 'ATA-4',
          multiplier: 1.0,
          initialReading: 3781.1,
        },
      ];

      const billingCycle: BillingCycle = {
        id: 'cycle-aug-2026',
        name: 'August 2026 Billing',
        createdAt: new Date().toISOString(),
        status: 'draft',
        mainBill: {
          billingMonth: '2026-08',
          periodFrom: '2026-07-22',
          periodTo: '2026-08-21',
          dueDate: '2026-08-30',
          totalAmountDue: 10374.90,
          totalMainKwh: 650.0,
          notes: 'Meralco SOA August 2026',
        },
        readings: {
          'meter-2': { previous: 778.1, present: 778.1 },
          'meter-3': { previous: 1381.4, present: 1717.5 },
          'meter-4': { previous: 3781.1, present: 3855.1 },
        },
        additionalCharges: {},
        commonAreaAllocMethod: 'equal',
      };

      return {
        units,
        meters,
        billingCycles: [billingCycle],
        activeCycleId: 'cycle-aug-2026',
        landlordInfo: {
          propertyName: 'Apartment Building',
          landlordName: 'Property Admin',
          contactNumber: '0917-888-9999',
          paymentDetails: 'GCash: 0917-888-9999 (Property Admin) | Bank: BDO 0012-3456-7890',
        },
      };
    },
  },
  {
    id: 'preset-4unit-all-submeters',
    name: '4 Units (All Dedicated Sub-Meters)',
    description: 'Standard 4-door apartment building where every single unit has its own dedicated physical sub-meter dial.',
    badge: 'Standard',
    unitCountText: '4 Units • 4 Sub-meters',
    generateData: (): AppData => {
      const units: TenantUnit[] = [
        { id: 'unit-101', unitNumber: 'Unit 101', tenantName: 'Tenant 101', contactNumber: '0917-101-0001', isOccupied: true },
        { id: 'unit-102', unitNumber: 'Unit 102', tenantName: 'Tenant 102', contactNumber: '0917-102-0002', isOccupied: true },
        { id: 'unit-201', unitNumber: 'Unit 201', tenantName: 'Tenant 201', contactNumber: '0917-201-0003', isOccupied: true },
        { id: 'unit-202', unitNumber: 'Unit 202', tenantName: 'Tenant 202', contactNumber: '0917-202-0004', isOccupied: true },
      ];

      const meters: SubMeter[] = [
        { id: 'meter-101', name: 'Unit 101 Sub-Meter', unitId: 'unit-101', type: 'tenant', meterNumber: 'SM-101', multiplier: 1.0, initialReading: 1200.0 },
        { id: 'meter-102', name: 'Unit 102 Sub-Meter', unitId: 'unit-102', type: 'tenant', meterNumber: 'SM-102', multiplier: 1.0, initialReading: 850.0 },
        { id: 'meter-201', name: 'Unit 201 Sub-Meter', unitId: 'unit-201', type: 'tenant', meterNumber: 'SM-201', multiplier: 1.0, initialReading: 1500.0 },
        { id: 'meter-202', name: 'Unit 202 Sub-Meter', unitId: 'unit-202', type: 'tenant', meterNumber: 'SM-202', multiplier: 1.0, initialReading: 650.0 },
      ];

      const billingCycle: BillingCycle = {
        id: 'cycle-current',
        name: 'Current Month Billing',
        createdAt: new Date().toISOString(),
        status: 'draft',
        mainBill: {
          billingMonth: new Date().toISOString().slice(0, 7),
          periodFrom: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
          periodTo: new Date().toISOString().slice(0, 10),
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          totalAmountDue: 8000.00,
          totalMainKwh: 500.0,
          notes: 'Meralco SOA',
        },
        readings: {
          'meter-101': { previous: 1200.0, present: 1350.0 },
          'meter-102': { previous: 850.0, present: 950.0 },
          'meter-201': { previous: 1500.0, present: 1650.0 },
          'meter-202': { previous: 650.0, present: 740.0 },
        },
        additionalCharges: {},
        commonAreaAllocMethod: 'equal',
      };

      return {
        units,
        meters,
        billingCycles: [billingCycle],
        activeCycleId: 'cycle-current',
        landlordInfo: {
          propertyName: '4-Door Residences',
          landlordName: 'Building Owner',
          contactNumber: '0917-000-0000',
          paymentDetails: 'GCash: 0917-000-0000 (Owner) | Maya / Cash',
        },
      };
    },
  },
  {
    id: 'preset-3unit-mainline',
    name: '3 Units (2 Sub-Meters + 1 Main Line)',
    description: '3-unit property where Landlord is on Main Line and 2 rental units have sub-meters.',
    badge: '3-Door Layout',
    unitCountText: '3 Units • 2 Sub-meters',
    generateData: (): AppData => {
      const units: TenantUnit[] = [
        { id: 'unit-1', unitNumber: 'Unit 1 (Main Line)', tenantName: 'Owner / Main Unit', isOccupied: true, isMainLine: true },
        { id: 'unit-2', unitNumber: 'Unit 2', tenantName: 'Tenant A', isOccupied: true },
        { id: 'unit-3', unitNumber: 'Unit 3', tenantName: 'Tenant B', isOccupied: true },
      ];

      const meters: SubMeter[] = [
        { id: 'meter-main', name: 'Main Line', unitId: 'unit-1', type: 'main_line', meterNumber: 'MAIN', multiplier: 1.0, initialReading: 0 },
        { id: 'meter-2', name: 'Unit 2 Sub-Meter', unitId: 'unit-2', type: 'tenant', meterNumber: 'SM-2', multiplier: 1.0, initialReading: 500.0 },
        { id: 'meter-3', name: 'Unit 3 Sub-Meter', unitId: 'unit-3', type: 'tenant', meterNumber: 'SM-3', multiplier: 1.0, initialReading: 800.0 },
      ];

      const billingCycle: BillingCycle = {
        id: 'cycle-current',
        name: 'Current Month Billing',
        createdAt: new Date().toISOString(),
        status: 'draft',
        mainBill: {
          billingMonth: new Date().toISOString().slice(0, 7),
          periodFrom: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
          periodTo: new Date().toISOString().slice(0, 10),
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          totalAmountDue: 6000.00,
          totalMainKwh: 400.0,
          notes: 'Meralco SOA',
        },
        readings: {
          'meter-2': { previous: 500.0, present: 620.0 },
          'meter-3': { previous: 800.0, present: 940.0 },
        },
        additionalCharges: {},
        commonAreaAllocMethod: 'equal',
      };

      return {
        units,
        meters,
        billingCycles: [billingCycle],
        activeCycleId: 'cycle-current',
        landlordInfo: {
          propertyName: '3-Door Apartment',
          landlordName: 'Landlord',
          contactNumber: '0917-000-0000',
          paymentDetails: 'GCash: 0917-000-0000',
        },
      };
    },
  },
  {
    id: 'preset-common-pump',
    name: 'Multi-Unit with Common Area Water Pump',
    description: 'Apartment units plus dedicated sub-meter for shared Water Pump & Hallway Lights split equally across tenants.',
    badge: 'With Common Area',
    unitCountText: '3 Units + 1 Common Meter',
    generateData: (): AppData => {
      const units: TenantUnit[] = [
        { id: 'unit-1', unitNumber: 'Unit 1', tenantName: 'Tenant 1', isOccupied: true },
        { id: 'unit-2', unitNumber: 'Unit 2', tenantName: 'Tenant 2', isOccupied: true },
        { id: 'unit-3', unitNumber: 'Unit 3', tenantName: 'Tenant 3', isOccupied: true },
      ];

      const meters: SubMeter[] = [
        { id: 'meter-1', name: 'Unit 1 Sub-Meter', unitId: 'unit-1', type: 'tenant', meterNumber: 'SM-1', multiplier: 1.0, initialReading: 1000.0 },
        { id: 'meter-2', name: 'Unit 2 Sub-Meter', unitId: 'unit-2', type: 'tenant', meterNumber: 'SM-2', multiplier: 1.0, initialReading: 1200.0 },
        { id: 'meter-3', name: 'Unit 3 Sub-Meter', unitId: 'unit-3', type: 'tenant', meterNumber: 'SM-3', multiplier: 1.0, initialReading: 900.0 },
        { id: 'meter-pump', name: 'Water Pump & Hallway', unitId: 'common', type: 'common', meterNumber: 'COM-01', multiplier: 1.0, initialReading: 350.0 },
      ];

      const billingCycle: BillingCycle = {
        id: 'cycle-current',
        name: 'Current Month Billing',
        createdAt: new Date().toISOString(),
        status: 'draft',
        mainBill: {
          billingMonth: new Date().toISOString().slice(0, 7),
          periodFrom: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
          periodTo: new Date().toISOString().slice(0, 10),
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          totalAmountDue: 7500.00,
          totalMainKwh: 500.0,
          notes: 'Meralco SOA',
        },
        readings: {
          'meter-1': { previous: 1000.0, present: 1140.0 },
          'meter-2': { previous: 1200.0, present: 1330.0 },
          'meter-3': { previous: 900.0, present: 1010.0 },
          'meter-pump': { previous: 350.0, present: 380.0 },
        },
        additionalCharges: {},
        commonAreaAllocMethod: 'equal',
      };

      return {
        units,
        meters,
        billingCycles: [billingCycle],
        activeCycleId: 'cycle-current',
        landlordInfo: {
          propertyName: 'Sunrise Compound',
          landlordName: 'Compound Admin',
          contactNumber: '0917-000-0000',
          paymentDetails: 'GCash: 0917-000-0000',
        },
      };
    },
  },
  {
    id: 'preset-blank',
    name: 'Blank Slate (Start from Scratch)',
    description: 'Completely clean setup with 0 units. Start fresh and build your custom apartment layout from the ground up.',
    badge: 'Empty Canvas',
    unitCountText: '0 Units (Clean Slate)',
    generateData: (): AppData => {
      const billingCycle: BillingCycle = {
        id: `cycle-${Date.now()}`,
        name: `${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })} Billing`,
        createdAt: new Date().toISOString(),
        status: 'draft',
        mainBill: {
          billingMonth: new Date().toISOString().slice(0, 7),
          periodFrom: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
          periodTo: new Date().toISOString().slice(0, 10),
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          totalAmountDue: 0,
          totalMainKwh: 0,
          notes: '',
        },
        readings: {},
        additionalCharges: {},
        commonAreaAllocMethod: 'equal',
      };

      return {
        units: [],
        meters: [],
        billingCycles: [billingCycle],
        activeCycleId: billingCycle.id,
        landlordInfo: {
          propertyName: 'My Apartment Property',
          landlordName: 'Property Admin',
          contactNumber: '',
          paymentDetails: 'GCash / Bank Transfer details here',
        },
      };
    },
  },
];
