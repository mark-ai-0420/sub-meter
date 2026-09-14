import { TenantCalculationResult, BillingCycle, AppData } from '../types';
import { formatPHP, formatKwh, formatNumber, formatDate } from '../utils/formatters';

export interface PdfPaymentInfo {
  isPaid?: boolean;
  referenceNumber?: string;
  paidAt?: string;
  paidDate?: string;
  paymentMethod?: string;
  notes?: string;
}

export const loadPdfLibraries = async () => {
  const [
    jspdfModule,
    autotableModule,
    qrcodeModule,
    html2canvasModule,
  ] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    import('qrcode'),
    import('html2canvas'),
  ]);

  const jsPDF = jspdfModule.default || (jspdfModule as any).jsPDF;
  const autoTable = autotableModule.default || autotableModule;
  const QRCode = qrcodeModule.default || qrcodeModule;
  const html2canvas = html2canvasModule.default || html2canvasModule;

  return { jsPDF, autoTable, QRCode, html2canvas };
};

export const generateSingleTenantPdf = async (
  tenant: TenantCalculationResult,
  cycle: BillingCycle,
  landlordInfo: AppData['landlordInfo'],
  paymentInfo?: PdfPaymentInfo | null
): Promise<void> => {
  const { jsPDF, autoTable, QRCode } = await loadPdfLibraries();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // A5 is standard for utility billing receipts (148mm x 210mm)
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Resolve Payment Status
  const payment =
    paymentInfo ||
    (cycle as any)?.payments?.[tenant.unitId] ||
    (tenant as any)?.payment ||
    null;
  const isPaid = !!payment?.isPaid;

  // Generate dynamic Payment QR Code Data URL
  const qrString =
    landlordInfo.paymentDetails ||
    (landlordInfo.contactNumber
      ? `GCash: ${landlordInfo.contactNumber} (${landlordInfo.landlordName || 'Landlord'})`
      : `Payment: ${landlordInfo.landlordName || 'Apartment Management'}`);

  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(qrString, {
      width: 180,
      margin: 1,
      color: {
        dark: '#0B192C',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.warn('Failed to generate payment QR code:', err);
  }

  // Top Header Banner
  doc.setFillColor(243, 112, 33); // Meralco Orange #F37021
  doc.rect(0, 0, pageWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('SUB-METER ELECTRICITY STATEMENT', pageWidth / 2, 10, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const propertyTitle = landlordInfo.propertyAddress
    ? `${landlordInfo.propertyName || 'Apartment'} • ${landlordInfo.propertyAddress}`
    : landlordInfo.propertyName || 'Apartment Building';
  doc.text(propertyTitle, pageWidth / 2, 16.5, { align: 'center' });

  // Bill Meta Section
  doc.setTextColor(30, 41, 59); // Slate-800
  let y = 29;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`Tenant: ${tenant.tenantName}`, 14, y);
  doc.text(`Unit: ${tenant.unitNumber}`, pageWidth - 14, y, { align: 'right' });

  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Billing Period: ${formatDate(cycle.mainBill.periodFrom)} - ${formatDate(cycle.mainBill.periodTo)}`, 14, y);
  doc.text(`Due Date: ${formatDate(cycle.mainBill.dueDate)}`, pageWidth - 14, y, { align: 'right' });

  // Payment Status Stamp / Badge
  y += 5;
  const badgeWidth = pageWidth - 28;
  const badgeHeight = 6.5;

  if (isPaid) {
    doc.setFillColor(220, 252, 231); // Emerald-100
    doc.setDrawColor(22, 163, 74); // Emerald-600
    doc.setLineWidth(0.4);
    doc.roundedRect(14, y, badgeWidth, badgeHeight, 1.5, 1.5, 'FD');

    doc.setTextColor(21, 128, 61); // Emerald-700
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const paidText = `PAID • Ref: ${payment?.referenceNumber || 'Verified'}${
      payment?.paidAt || payment?.paidDate ? ` • ${formatDate(payment.paidAt || payment.paidDate)}` : ''
    }`;
    doc.text(paidText, pageWidth / 2, y + 4.5, { align: 'center' });
  } else {
    doc.setFillColor(254, 242, 242); // Red-50
    doc.setDrawColor(239, 68, 68); // Red-500
    doc.setLineWidth(0.4);
    doc.roundedRect(14, y, badgeWidth, badgeHeight, 1.5, 1.5, 'FD');

    doc.setTextColor(185, 28, 28); // Red-700
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`PAYMENT DUE: ${formatDate(cycle.mainBill.dueDate)}`, pageWidth / 2, y + 4.5, { align: 'center' });
  }

  y += badgeHeight + 3.5;
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.3);
  doc.line(14, y, pageWidth - 14, y);

  // Meter Reading Breakdown Table
  y += 4;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('1. Sub-Meter Electricity Calculation', 14, y);

  const meterRows = tenant.isMainLine
    ? [
        ['Connection Type', 'Direct Main Line (Main Meter Remainder)'],
        ['Direct Consumption', formatKwh(tenant.directKwh)],
        ['Common Area Share', `+ ${formatKwh(tenant.commonAreaShareKwh)}`],
        ['Total Effective Consumption', formatKwh(tenant.effectiveKwh)],
        ['Effective Rate (PHP/kWh)', formatPHP(tenant.effectiveRate)],
        ['Electricity Charge (PHP)', formatPHP(tenant.electricityAmount)],
      ]
    : [
        ['Sub-Meter Identifier', `${tenant.meterName} ${tenant.meterNumber ? `(${tenant.meterNumber})` : ''}`],
        ['Previous Reading (kWh)', formatNumber(tenant.previousReading, 1)],
        ['Present Reading (kWh)', formatNumber(tenant.presentReading, 1)],
        ['Direct Consumption', formatKwh(tenant.directKwh)],
        ['Common Area Share', `+ ${formatKwh(tenant.commonAreaShareKwh)}`],
        ['Line Loss / Discrepancy Share', `+ ${formatKwh(tenant.lossShareKwh)}`],
        ['Total Effective Consumption', formatKwh(tenant.effectiveKwh)],
        ['Effective Rate (PHP/kWh)', formatPHP(tenant.effectiveRate)],
        ['Electricity Charge (PHP)', formatPHP(tenant.electricityAmount)],
      ];

  autoTable(doc, {
    startY: y + 2,
    head: [['Item Description', 'Detail / Value']],
    body: meterRows,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 25, 44], // Meralco Navy
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: 1.8,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 1.6,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  const lastTableY = (doc as any).lastAutoTable.finalY || y + 36;
  let nextY = lastTableY + 4;

  // Other Charges Table (if any) — With Water Sub-Meter Breakdown Support
  if (tenant.additionalCharges.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('2. Additional Charges & Adjustments', 14, nextY);

    const chargeRows = tenant.additionalCharges.map((item) => {
      const isWater = item.type === 'water' || item.name.toLowerCase().includes('water');
      // Format water sub-meter charges with cubic meters (m³) indicator
      const displayName = isWater
        ? `${item.name}`
        : item.name;

      return [
        displayName,
        `${item.amount < 0 ? '-' : ''}${formatPHP(Math.abs(item.amount))}`,
      ];
    });
    chargeRows.push(['Other Charges Subtotal', formatPHP(tenant.additionalTotal)]);

    autoTable(doc, {
      startY: nextY + 2,
      head: [['Charge Item / Description', 'Amount']],
      body: chargeRows,
      theme: 'grid',
      headStyles: {
        fillColor: [71, 85, 105], // Slate
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 1.8,
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
        cellPadding: 1.6,
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    nextY = (doc as any).lastAutoTable.finalY + 4;
  }

  // Total Due Callout Box
  doc.setFillColor(254, 242, 232); // Amber-50
  doc.setDrawColor(243, 112, 33);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, nextY, pageWidth - 28, 13, 2, 2, 'FD');

  doc.setTextColor(194, 65, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('TOTAL AMOUNT DUE:', 20, nextY + 8.5);

  doc.setFontSize(12);
  doc.text(formatPHP(tenant.totalAmountDue), pageWidth - 20, nextY + 9, { align: 'right' });

  // Payment Details & Dynamic QR Code Box Footer
  nextY += 16;
  const footerBoxHeight = 27;
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.3);
  doc.roundedRect(14, nextY, pageWidth - 28, footerBoxHeight, 2, 2, 'FD');

  if (qrDataUrl) {
    // Left text area (width 86mm)
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Payment Instructions & Channels:', 18, nextY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    const paymentLines = doc.splitTextToSize(
      landlordInfo.paymentDetails || 'Please settle on or before the due date.',
      84
    );
    doc.text(paymentLines, 18, nextY + 10);

    const adminText = [landlordInfo.landlordName, landlordInfo.contactNumber].filter(Boolean).join(' • ');
    if (adminText) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(`Admin: ${adminText}`, 18, nextY + 23.5);
    }

    // Right QR Code area (22mm x 22mm)
    const qrSize = 21;
    const qrX = pageWidth - 14 - qrSize - 3;
    const qrY = nextY + 2;
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Scan to Pay GCash', qrX + qrSize / 2, qrY + qrSize + 2.5, { align: 'center' });
  } else {
    // Full width text if no QR
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Payment Instructions:', 18, nextY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const paymentLines = doc.splitTextToSize(
      landlordInfo.paymentDetails || 'Please settle on or before the due date.',
      pageWidth - 36
    );
    doc.text(paymentLines, 18, nextY + 11.5);
  }

  // Save PDF
  const filename = `Submeter_Bill_${tenant.unitNumber.replace(/\s+/g, '_')}_${cycle.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};

export const generateMasterSummaryPdf = async (
  cycle: BillingCycle,
  landlordInfo: AppData['landlordInfo']
): Promise<void> => {
  const summary = cycle.calculationSummary;
  if (!summary) return;

  const { jsPDF, autoTable } = await loadPdfLibraries();

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(11, 25, 44); // Navy
  doc.rect(0, 0, pageWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`MASTER BILLING ALLOCATION SUMMARY - ${cycle.name.toUpperCase()}`, 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `Property: ${landlordInfo.propertyName || 'Apartment'} | Period: ${formatDate(cycle.mainBill.periodFrom)} - ${formatDate(cycle.mainBill.periodTo)} | Due: ${formatDate(cycle.mainBill.dueDate)}`,
    14,
    17
  );

  // Summary Metrics Banner
  let y = 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  const metrics = [
    `Meralco Main Bill: ${formatPHP(summary.meralcoTotalAmount)}`,
    `Main kWh: ${formatKwh(summary.totalMainKwh)}`,
    `Effective Rate: ${formatPHP(summary.effectiveBaseRate)}/kWh`,
    `Sub-Meters Total: ${formatKwh(summary.totalSubMeterKwh)}`,
    `Line Loss / Diff: ${formatKwh(summary.residualLossKwh)} (${formatNumber(summary.residualLossPercent, 1)}%)`,
    `Total Collectible: ${formatPHP(summary.grandTotalBilled)}`,
  ];
  doc.text(metrics.join('   |   '), 14, y);

  // Tenant Table
  y += 4;
  const tableData = summary.tenantResults.map((t) => [
    t.unitNumber,
    t.tenantName,
    formatNumber(t.previousReading, 1),
    formatNumber(t.presentReading, 1),
    formatKwh(t.directKwh),
    formatKwh(t.commonAreaShareKwh),
    formatKwh(t.lossShareKwh),
    formatKwh(t.effectiveKwh),
    formatPHP(t.electricityAmount),
    formatPHP(t.additionalTotal),
    formatPHP(t.totalAmountDue),
  ]);

  // Total Summary Row
  tableData.push([
    'TOTAL',
    `${summary.tenantResults.length} Units`,
    '-',
    '-',
    formatKwh(summary.totalTenantDirectKwh),
    formatKwh(summary.totalCommonAreaKwh),
    formatKwh(summary.residualLossKwh),
    formatKwh(summary.totalMainKwh),
    formatPHP(summary.totalElectricityBilled),
    formatPHP(summary.totalAdditionalCharges),
    formatPHP(summary.grandTotalBilled),
  ]);

  autoTable(doc, {
    startY: y,
    head: [[
      'Unit',
      'Tenant Name',
      'Prev',
      'Pres',
      'Direct kWh',
      'Common kWh',
      'Loss kWh',
      'Total kWh',
      'Electricity (₱)',
      'Other (₱)',
      'Total Due (₱)',
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [243, 112, 33],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 32 },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right', fontStyle: 'bold' },
      8: { halign: 'right', fontStyle: 'bold' },
      9: { halign: 'right' },
      10: { halign: 'right', fontStyle: 'bold', textColor: [194, 65, 12] },
    },
    margin: { left: 14, right: 14 },
  });

  const filename = `Master_Summary_${cycle.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};

export const exportMasterSummaryCsv = (
  cycle: BillingCycle,
  landlordInfo: AppData['landlordInfo']
): void => {
  const summary = cycle.calculationSummary;
  if (!summary) return;

  const headers = [
    'Unit Number',
    'Tenant Name',
    'Previous Reading',
    'Present Reading',
    'Direct kWh',
    'Common Area Share kWh',
    'Line Loss Share kWh',
    'Effective Total kWh',
    'Effective Rate (PHP/kWh)',
    'Electricity Amount (PHP)',
    'Other Charges (PHP)',
    'Total Amount Due (PHP)',
  ];

  const rows = summary.tenantResults.map((t) => [
    `"${t.unitNumber}"`,
    `"${t.tenantName}"`,
    t.previousReading,
    t.presentReading,
    t.directKwh.toFixed(2),
    t.commonAreaShareKwh.toFixed(2),
    t.lossShareKwh.toFixed(2),
    t.effectiveKwh.toFixed(2),
    t.effectiveRate.toFixed(4),
    t.electricityAmount.toFixed(2),
    t.additionalTotal.toFixed(2),
    t.totalAmountDue.toFixed(2),
  ]);

  const csvContent = [
    `# Master Billing Allocation Summary: ${cycle.name}`,
    `# Property: ${landlordInfo.propertyName}`,
    `# Billing Period: ${cycle.mainBill.periodFrom} to ${cycle.mainBill.periodTo}`,
    `# Due Date: ${cycle.mainBill.dueDate}`,
    `# Total Main Meralco Bill: PHP ${summary.meralcoTotalAmount}`,
    `# Total Main kWh: ${summary.totalMainKwh}`,
    `# Effective Rate: PHP ${summary.effectiveBaseRate.toFixed(4)}/kWh`,
    '',
    headers.join(','),
    ...rows.map((r) => r.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Submeter_Summary_${cycle.name.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadAllIndividualPdfs = async (
  cycle: BillingCycle,
  landlordInfo: AppData['landlordInfo']
): Promise<void> => {
  const summary = cycle.calculationSummary;
  if (!summary) return;
  await loadPdfLibraries();
  for (let idx = 0; idx < summary.tenantResults.length; idx++) {
    const tenant = summary.tenantResults[idx];
    await generateSingleTenantPdf(tenant, cycle, landlordInfo);
    if (idx < summary.tenantResults.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
};

export const generateShareableBillCard = async (
  elementOrId: HTMLElement | string,
  filename: string = 'bill-summary.png'
): Promise<string | null> => {
  const { html2canvas } = await loadPdfLibraries();
  const element = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!element) return null;
  const canvas = await (html2canvas as any)(element, { scale: 2, useCORS: true });
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
  return dataUrl;
};

