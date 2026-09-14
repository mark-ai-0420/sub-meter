import puppeteer from 'puppeteer';
import path from 'path';

const outDir = '/Users/markhuelgas/.gemini/antigravity/brain/a40b3151-1897-4f05-a551-e8bc977a9de4/screenshots';

async function capture() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 960, deviceScaleFactor: 2 },
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // 1. Step 1: Main Bill
  await page.screenshot({ path: path.join(outDir, '01_main_bill_step.png') });
  console.log('Captured 01_main_bill_step.png');

  // 2. Step 2: Sub-Meter Readings
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const step2Btn = buttons.find((b) => b.textContent && b.textContent.includes('2. Meter Readings'));
    if (step2Btn) step2Btn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '02_meter_readings_step.png') });
  console.log('Captured 02_meter_readings_step.png');

  // 3. Step 3: Tenant Slips & Statements
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const step3Btn = buttons.find((b) => b.textContent && b.textContent.includes('3. Review & Send'));
    if (step3Btn) step3Btn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, '03_tenant_statements.png') });
  console.log('Captured 03_tenant_statements.png');

  // 4. Units & Sub-Meters Setup Tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button'));
    const unitsTab = tabs.find((b) => b.textContent && b.textContent.includes('Units & Sub-Meters'));
    if (unitsTab) unitsTab.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '04_units_setup.png') });
  console.log('Captured 04_units_setup.png');

  // 5. Presets & Templates Modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const presetsBtn = btns.find((b) => b.textContent && b.textContent.includes('Presets & Templates'));
    if (presetsBtn) presetsBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '05_presets_modal.png') });
  console.log('Captured 05_presets_modal.png');

  // Close modal
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 400));

  // 6. Settings & Customization Modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const settingsBtn = btns.find((b) => b.title && b.title.includes('Settings'));
    if (settingsBtn) settingsBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '06_settings_customization.png') });
  console.log('Captured 06_settings_customization.png');

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(console.error);
