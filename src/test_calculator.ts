import { calculateBillingCycle } from './services/calculator';
import { TenantUnit, SubMeter } from './types';

const units: TenantUnit[] = [
  { id: 'unit-1', unitNumber: 'Unit 1 (Main Line)', tenantName: 'Landlord / Main', isOccupied: true, isMainLine: true },
  { id: 'unit-2', unitNumber: 'Unit 2', tenantName: 'Rico', isOccupied: true },
  { id: 'unit-3', unitNumber: 'Unit 3', tenantName: 'Ehya', isOccupied: true },
  { id: 'unit-4', unitNumber: 'Unit 4', tenantName: 'Ton', isOccupied: true },
];

const meters: SubMeter[] = [
  { id: 'meter-1', name: 'Main Line', unitId: 'unit-1', type: 'main_line', multiplier: 1.0, initialReading: 0 },
  { id: 'meter-2', name: 'Unit 2 Submeter', unitId: 'unit-2', type: 'tenant', meterNumber: 'ATA-2', multiplier: 1.0, initialReading: 778.1 },
  { id: 'meter-3', name: 'Unit 3 Submeter', unitId: 'unit-3', type: 'tenant', meterNumber: 'ATA-3', multiplier: 1.0, initialReading: 1381.4 },
  { id: 'meter-4', name: 'Unit 4 Submeter', unitId: 'unit-4', type: 'tenant', meterNumber: 'ATA-4', multiplier: 1.0, initialReading: 3781.1 },
];

const result = calculateBillingCycle({
  units,
  meters,
  mainBill: {
    billingMonth: '2026-08',
    periodFrom: '2026-07-22',
    periodTo: '2026-08-21',
    dueDate: '2026-08-30',
    totalAmountDue: 10374.90,
    totalMainKwh: 650.0,
  },
  readings: {
    'meter-2': { previous: 778.1, present: 778.1 },
    'meter-3': { previous: 1381.4, present: 1717.5 },
    'meter-4': { previous: 3781.1, present: 3855.0 },
  },
  additionalCharges: {},
  commonAreaAllocMethod: 'equal',
});

console.log('=== AUGUST 2026 4-UNIT & 3-SUBMETER VERIFICATION ===');
console.log('Main Meralco Bill:', result.meralcoTotalAmount);
console.log('Main Meralco kWh:', result.totalMainKwh);
console.log('Effective Base Rate (PHP/kWh):', result.effectiveBaseRate.toFixed(6));
console.log('Total Electricity Billed:', result.totalElectricityBilled);
console.log('Difference:', Math.abs(result.totalElectricityBilled - result.meralcoTotalAmount));

console.log('\nTenant Breakdown:');
result.tenantResults.forEach((t) => {
  console.log(`- ${t.unitNumber} (${t.tenantName}): Direct ${t.directKwh.toFixed(1)} kWh | Electricity: ₱${t.electricityAmount.toFixed(2)} | Total Due: ₱${t.totalAmountDue.toFixed(2)}`);
});
