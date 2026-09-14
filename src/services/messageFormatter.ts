import { TenantCalculationResult, BillingCycle, AppData } from '../types';
import { formatPHP, formatKwh, formatNumber, formatDate } from '../utils/formatters';

export interface PaymentStatusInfo {
  isPaid?: boolean;
  referenceNumber?: string;
  paidAt?: string;
  paidDate?: string;
  paymentMethod?: string;
  notes?: string;
}

export const formatTenantTextMessage = (
  tenant: TenantCalculationResult,
  cycle: BillingCycle,
  landlordInfo: AppData['landlordInfo'],
  paymentInfo?: PaymentStatusInfo | null
): string => {
  // Resolve payment info from argument or cycle/tenant fallback
  const payment =
    paymentInfo ||
    (cycle as any)?.payments?.[tenant.unitId] ||
    (tenant as any)?.payment ||
    null;
  const isPaid = !!payment?.isPaid;

  const lineItemsText =
    tenant.additionalCharges.length > 0
      ? tenant.additionalCharges
          .map((item) => {
            const isWater = item.type === 'water' || item.name.toLowerCase().includes('water');
            const icon = isWater ? '💧' : '•';
            return `  ${icon} ${item.name}: ${item.amount < 0 ? '-' : ''}${formatPHP(Math.abs(item.amount))}`;
          })
          .join('\n')
      : '  (None)';

  const commonAreaLine =
    tenant.commonAreaShareKwh > 0
      ? `  • Common Area Share: +${formatKwh(tenant.commonAreaShareKwh)}`
      : '';

  const lossShareLine =
    tenant.lossShareKwh > 0
      ? `  • Line Loss / Residual Share: +${formatKwh(tenant.lossShareKwh)}`
      : '';

  const paymentSection = isPaid
    ? `✅ *PAYMENT STATUS:* *PAID IN FULL*
${payment?.referenceNumber ? `🔖 *GCash/Ref #:* \`${payment.referenceNumber}\`\n` : ''}${payment?.paidAt || payment?.paidDate ? `📅 *Paid On:* ${formatDate(payment.paidAt || payment.paidDate)}\n` : ''}${payment?.paymentMethod ? `💳 *Channel:* ${payment.paymentMethod}\n` : ''}
🙏 *Thank you for your prompt payment!*`
    : `⏳ *PAYMENT STATUS:* *PENDING / DUE*
⏰ *Due Date:* *${formatDate(cycle.mainBill.dueDate)}*

💳 *PAYMENT INSTRUCTIONS:*
${landlordInfo.paymentDetails || 'Please pay to landlord on or before the due date.'}
${landlordInfo.landlordName || landlordInfo.contactNumber ? `\n👤 *Admin Contact:* ${[landlordInfo.landlordName, landlordInfo.contactNumber].filter(Boolean).join(' • ')}` : ''}

🙏 Thank you for settling on or before the due date!`;

  return `⚡ *MERALCO SUB-METER BILLING STATEMENT* ⚡
📍 *${landlordInfo.propertyName || 'Apartment'}*
━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Tenant:* ${tenant.tenantName} (${tenant.unitNumber})
📅 *Period:* ${formatDate(cycle.mainBill.periodFrom)} - ${formatDate(cycle.mainBill.periodTo)}
⏰ *Due Date:* ${formatDate(cycle.mainBill.dueDate)}

🔌 *ELECTRICITY CONSUMPTION DETAILS:*
${
  tenant.isMainLine
    ? `  • Connection: Direct Main Line (Main Meter Remainder)
  • Direct Usage:     *${formatKwh(tenant.directKwh)}*`
    : `  • Sub-Meter: ${tenant.meterName} ${tenant.meterNumber ? `[${tenant.meterNumber}]` : ''}
  • Previous Reading: ${formatNumber(tenant.previousReading, 1)} kWh
  • Present Reading:  ${formatNumber(tenant.presentReading, 1)} kWh
  • Direct Usage:     *${formatKwh(tenant.directKwh)}*`
}
${commonAreaLine ? commonAreaLine + '\n' : ''}${lossShareLine ? lossShareLine + '\n' : ''}  • Effective Total:  *${formatKwh(tenant.effectiveKwh)}*
  • Effective Rate:   ${formatPHP(tenant.effectiveRate)}/kWh

💵 *ELECTRICITY CHARGE:* *${formatPHP(tenant.electricityAmount)}*

📋 *OTHER CHARGES / DEDUCTIONS:*
${lineItemsText}
${tenant.additionalCharges.length > 0 ? `  • Subtotal (Other): ${formatPHP(tenant.additionalTotal)}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL AMOUNT DUE:* *${formatPHP(tenant.totalAmountDue)}*
━━━━━━━━━━━━━━━━━━━━━━━━━━

${paymentSection}`;
};

export const formatGroupSummaryTextMessage = (
  cycle: BillingCycle,
  landlordInfo: AppData['landlordInfo']
): string => {
  const summary = cycle.calculationSummary;
  if (!summary) return 'No calculation summary available.';

  const tenantLines = summary.tenantResults
    .map(
      (t) =>
        `▪️ *${t.unitNumber}* (${t.tenantName}): ${formatKwh(t.directKwh)} direct | *${formatPHP(t.totalAmountDue)}*`
    )
    .join('\n');

  return `📊 *MERALCO MASTER BILL SUMMARY - ${cycle.name}*
📍 *${landlordInfo.propertyName || 'Apartment'}*
━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 *Period:* ${formatDate(cycle.mainBill.periodFrom)} - ${formatDate(cycle.mainBill.periodTo)}
⏰ *Due Date:* ${formatDate(cycle.mainBill.dueDate)}

⚡ *Meralco Main Bill:* ${formatPHP(summary.meralcoTotalAmount)} (${formatKwh(summary.totalMainKwh)})
📈 *Effective Rate:* ${formatPHP(summary.effectiveBaseRate)}/kWh
🔌 *Total Sub-Meters:* ${formatKwh(summary.totalSubMeterKwh)}
🌐 *Line Loss / Difference:* ${formatKwh(summary.residualLossKwh)} (${formatNumber(summary.residualLossPercent, 1)}%)

👥 *TENANT BREAKDOWN:*
${tenantLines}

💰 *TOTAL COLLECTIBLE:* *${formatPHP(summary.grandTotalBilled)}*
━━━━━━━━━━━━━━━━━━━━━━━━━━
Payment channels: ${landlordInfo.paymentDetails}`;
};

/**
 * Generates a Viber deep-link.
 * If phone number is provided, formats `viber://chat?number=${cleanPhone}`.
 * Otherwise formats `viber://forward?text=${encodeURIComponent(text)}`.
 */
export const generateViberDeepLink = (phoneNumber?: string, text?: string): string => {
  const cleanPhone = phoneNumber ? phoneNumber.replace(/[^0-9+]/g, '') : '';
  if (cleanPhone) {
    return `viber://chat?number=${encodeURIComponent(cleanPhone)}`;
  }
  return `viber://forward?text=${encodeURIComponent(text || '')}`;
};

/**
 * Generates a WhatsApp direct chat deep-link with pre-filled message text.
 * Formats `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`.
 */
export const generateWhatsAppDeepLink = (phoneNumber?: string, text?: string): string => {
  let cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, '') : '';
  // Convert standard Philippine 09xx mobile format to 639xx for international WhatsApp link
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '63' + cleanPhone.substring(1);
  }
  const encodedText = encodeURIComponent(text || '');
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
};

/**
 * Triggers native Web Share API on mobile / modern browsers.
 * Returns true if sharing was initiated successfully, false otherwise.
 */
export const shareViaWebShare = async (title: string, text: string): Promise<boolean> => {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text });
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Web Share failed:', err);
      }
      return false;
    }
  }
  return false;
};

