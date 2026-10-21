// HTML -> PDF con Puppeteer. Se reutiliza un solo Chromium (se lanza en el primer uso
// y se relanza si se cae) en vez de abrir uno por certificado.
import fs from 'node:fs';
import path from 'node:path';
import puppeteer, { type Browser } from 'puppeteer-core';
import type { Orientation, PageSize } from '@certify/shared';
import { env } from '../config/env';
import { absoluteDir, STORAGE_DIRS, toPublicPath } from '../lib/storage';

// Dimensiones en pixeles a 96 DPI
const PAGE_DIMENSIONS: Record<PageSize, Record<Orientation, { width: number; height: number }>> = {
  letter: { landscape: { width: 1056, height: 816 }, portrait: { width: 816, height: 1056 } },
  A4: { landscape: { width: 1123, height: 794 }, portrait: { width: 794, height: 1123 } },
};

export interface PdfOptions {
  orientation: Orientation;
  page_size: PageSize;
}

let browserPromise: Promise<Browser> | null = null;

const getBrowser = async () => {
  if (browserPromise) {
    const browser = await browserPromise;
    if (browser.connected) return browser;
  }
  browserPromise = puppeteer.launch({
    executablePath: env.PUPPETEER_EXECUTABLE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  return browserPromise;
};

export const closeBrowser = async () => {
  if (!browserPromise) return;
  const browser = await browserPromise;
  browserPromise = null;
  await browser.close();
};

export const renderPdf = async (html: string, { orientation, page_size }: PdfOptions): Promise<Buffer> => {
  const dims = PAGE_DIMENSIONS[page_size][orientation];
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    // Viewport fijo para que el render sea identico en cualquier equipo
    await page.setViewport({ width: dims.width, height: dims.height, deviceScaleFactor: 1 });
    // Las imagenes van en data URL; ademas se espera a que carguen las fuentes web de la plantilla
    await page.setContent(html, { waitUntil: 'load', timeout: 30_000 });
    await page.evaluate('document.fonts.ready');
    const pdf = await page.pdf({
      width: `${dims.width}px`,
      height: `${dims.height}px`,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
};

/** Guarda el PDF en storage/certificates y devuelve su ruta publica. */
export const savePdf = (pdf: Buffer, filename: string) => {
  const dir = absoluteDir(STORAGE_DIRS.certificates);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), pdf);
  return toPublicPath(STORAGE_DIRS.certificates, filename);
};
