import puppeteer from "puppeteer";
import path from "path";

const outDir = "/Users/markhuelgas/.gemini/antigravity/brain/a40b3151-1897-4f05-a551-e8bc977a9de4/screenshots";

async function capture() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 2 },
  });

  const page = await browser.newPage();
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });

  // 1. Navigate to Step 3 (Review & Statements)
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const step3Btn = buttons.find((b) => b.textContent && b.textContent.includes("3. Review & Send"));
    if (step3Btn) step3Btn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // 2. Open QuickShare / Viber / WhatsApp Modal on First Unit
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const viberBtn = buttons.find((b) => b.textContent && (b.textContent.includes("Viber / SMS") || b.textContent.includes("Share")));
    if (viberBtn) viberBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Capture QuickShare / Viber modal with 1-click deep links
  await page.screenshot({ path: path.join(outDir, "10_viber_whatsapp_quickshare.png") });
  console.log("Captured 10_viber_whatsapp_quickshare.png");

  // Close QuickShare modal
  await page.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 400));

  await browser.close();
  console.log("QuickShare screenshot updated successfully!");
}

capture().catch(console.error);
