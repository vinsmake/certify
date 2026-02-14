const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { ensureDirectoryExists } = require('../utils/fileUtils');

const CERTIFICATES_DIR = '/app/storage/certificates';

// Dimensiones de pagina en pixeles a 96 DPI
const PAGE_DIMENSIONS = {
  letter: {
    landscape: { width: 1056, height: 816 },   // 11" x 8.5"
    portrait:  { width: 816,  height: 1056 },  // 8.5" x 11"
  },
  a4: {
    landscape: { width: 1123, height: 794 },   // 297mm x 210mm
    portrait:  { width: 794,  height: 1123 },  // 210mm x 297mm
  },
};

/**
 * 13.06 / 13.07 / 13.08 - Genera un PDF a partir de HTML usando Puppeteer.
 * Usa un viewport fijo para garantizar renderizado consistente.
 *
 * @param {string} html - HTML completo ya renderizado con las variables inyectadas
 * @param {Object} options - { orientation: 'landscape'|'portrait', page_size: 'letter'|'a4' }
 * @returns {Promise<Buffer>} - Buffer del PDF generado
 */
const generatePDF = async (html, options = {}) => {
  const orientation = options.orientation || 'landscape';
  const pageSize    = (options.page_size || 'letter').toLowerCase();

  const dims = (PAGE_DIMENSIONS[pageSize] || PAGE_DIMENSIONS.letter)[orientation]
              || PAGE_DIMENSIONS.letter.landscape;

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();

    // 13.08 - Viewport fijo para renderizado consistente
    await page.setViewport({ width: dims.width, height: dims.height, deviceScaleFactor: 1 });

    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdfBuffer = await page.pdf({
      width:           `${dims.width}px`,
      height:          `${dims.height}px`,
      printBackground: true,
      margin:          { top: '0', right: '0', bottom: '0', left: '0' },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
};

/**
 * 13.09 / 13.10 - Guarda el buffer del PDF en storage/certificates/
 * con el nombre certificate_{uuid}.pdf
 *
 * @param {Buffer} pdfBuffer
 * @param {string} uuid
 * @returns {string} ruta relativa del archivo guardado (para guardar en BD)
 */
const savePDF = (pdfBuffer, uuid) => {
  ensureDirectoryExists(CERTIFICATES_DIR);

  const filename = `certificate_${uuid}.pdf`;
  const absolutePath = path.join(CERTIFICATES_DIR, filename);

  fs.writeFileSync(absolutePath, pdfBuffer);

  return `/storage/certificates/${filename}`;
};

/**
 * Funcion combinada: genera el PDF y lo guarda en disco.
 *
 * @param {string} html - HTML renderizado
 * @param {string} uuid - UUID del certificado
 * @param {Object} options - { orientation, page_size }
 * @returns {Promise<{pdfPath: string, pdfBuffer: Buffer}>}
 */
const generateAndSavePDF = async (html, uuid, options = {}) => {
  const pdfBuffer = await generatePDF(html, options);
  const pdfPath   = savePDF(pdfBuffer, uuid);
  return { pdfPath, pdfBuffer };
};

module.exports = { generatePDF, savePDF, generateAndSavePDF };
