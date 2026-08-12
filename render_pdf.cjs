const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const htmlPath = path.join(__dirname, 'public', 'estatutos_redisenados.html');
    const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;

    console.log(`Loading URL: ${fileUrl}`);
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    const pdfPath = path.join(__dirname, 'public', 'Estatutos_PRUANED_AG_Redisenados.pdf');

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 7.5pt; font-family: 'Outfit', 'Helvetica', sans-serif; width: 100%; border-bottom: 1px solid #CBD5E1; padding-bottom: 3px; margin: 0 15mm; display: flex; justify-content: space-between; color: #475569; font-weight: bold; -webkit-print-color-adjust: exact;">
          <span>ASOCIACIÓN GREMIAL PRUANED A.G. &bull; ESTATUTOS Y REGLAMENTO GENERAL</span>
          <span style="color: #0066B2;">2025</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 7.5pt; font-family: 'Inter', 'Helvetica', sans-serif; width: 100%; border-top: 1px solid #CBD5E1; padding-top: 3px; margin: 0 15mm; display: flex; justify-content: space-between; color: #64748B; -webkit-print-color-adjust: exact;">
          <span style="font-style: italic; color: #0066B2;">“Por la inclusión de los animales en la gestión del riesgo de desastres”</span>
          <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
        </div>
      `,
      margin: {
        top: '22mm',
        bottom: '22mm',
        left: '15mm',
        right: '15mm'
      }
    });

    await browser.close();
    console.log(`PDF successfully generated at: ${pdfPath}`);
  } catch (err) {
    console.error('Error generating PDF:', err);
    process.exit(1);
  }
})();
