const CertificateTemplate = require('../models/CertificateTemplate');
const BrandingVersion = require('../models/BrandingVersion');
const { resolveLogos } = require('../services/templateService');
const { generateQR } = require('../services/qrService');
const puppeteer = require('puppeteer');

const listTemplates = async (req, res, next) => {
  try {
    const templates = await CertificateTemplate.findAll();
    res.json(templates);
  } catch (err) {
    next(err);
  }
};

const getTemplate = async (req, res, next) => {
  try {
    const template = await CertificateTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }
    res.json(template);
  } catch (err) {
    next(err);
  }
};

const createTemplate = async (req, res, next) => {
  try {
    const { name, slug, description, html_content, orientation, page_size } = req.body;

    const existing = await CertificateTemplate.findBySlug(slug);
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una plantilla con ese slug' });
    }

    const template = await CertificateTemplate.create({
      name,
      slug,
      description,
      html_content,
      orientation,
      page_size,
      created_by: req.user.userId,
    });

    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const { name, slug, description, html_content, orientation, page_size } = req.body;

    if (slug) {
      const existing = await CertificateTemplate.findBySlug(slug);
      if (existing && existing.id !== parseInt(req.params.id)) {
        return res.status(409).json({ error: 'Ya existe otra plantilla con ese slug' });
      }
    }

    const template = await CertificateTemplate.update(req.params.id, {
      name, slug, description, html_content, orientation, page_size,
    });

    if (!template) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    res.json(template);
  } catch (err) {
    next(err);
  }
};

const deactivateTemplate = async (req, res, next) => {
  try {
    const template = await CertificateTemplate.deactivate(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }
    res.json({ message: 'Plantilla desactivada', id: template.id });
  } catch (err) {
    next(err);
  }
};

const previewTemplate = async (req, res, next) => {
  try {
    const template = await CertificateTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    // Obtener logo institucional real del branding activo
    const brandingVersion = await BrandingVersion.findActive();
    const { institutionalLogoBase64 } = resolveLogos(brandingVersion, []);

    // Generar QR de ejemplo apuntando a vinsmake.dev
    const sampleUuid = '550e8400-e29b-41d4-a716-446655440000';
    const sampleQrBase64 = await generateQR(sampleUuid);

    // Datos de ejemplo para preview
    const sampleData = {
      participant_name: 'Juan Carlos Perez',
      document_id: 'V-12345678',
      course_name: 'Curso de Ejemplo',
      course_type: 'Taller',
      course_duration: '40',
      instructor: 'Maria Garcia',
      issue_date: new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' }),
      certificate_uuid: sampleUuid,
      verification_url: 'https://vinsmake.dev/verificar/' + sampleUuid,
      qr_code_base64: sampleQrBase64,
      institutional_logo_base64: institutionalLogoBase64,
      dependency_logos_html: '',
      dependency_names: 'Dependencia General',
      primary_color: '#1a365d',
      secondary_color: '#2b6cb0',
      font_family: 'Roboto',
      organization_name: 'Organizacion de Ejemplo',
    };

    // Reemplazar variables en la plantilla
    let html = template.html_content;
    for (const [key, value] of Object.entries(sampleData)) {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    // Dimensiones segun orientacion y tamano
    const dimensions = {
      letter: { landscape: { width: 1056, height: 816 }, portrait: { width: 816, height: 1056 } },
      A4: { landscape: { width: 1123, height: 794 }, portrait: { width: 794, height: 1123 } },
    };
    const size = dimensions[template.page_size] || dimensions.letter;
    const dim = size[template.orientation] || size.landscape;

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: '/usr/bin/chromium-browser',
    });
    const page = await browser.newPage();
    await page.setViewport({ width: dim.width, height: dim.height });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      width: dim.width + 'px',
      height: dim.height + 'px',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="preview_${template.slug}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

const setDefault = async (req, res, next) => {
  try {
    const template = await CertificateTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    const updated = await CertificateTemplate.setDefault(req.params.id);
    res.json({ message: 'Plantilla establecida como default', id: updated.id, name: updated.name });
  } catch (err) {
    next(err);
  }
};

// GET /sample-qr - QR de ejemplo para preview en tiempo real del frontend
const sampleQr = async (req, res, next) => {
  try {
    const qrBase64 = await generateQR('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    res.json({ qr_code_base64: qrBase64 });
  } catch (err) {
    next(err);
  }
};

module.exports = { listTemplates, getTemplate, createTemplate, updateTemplate, deactivateTemplate, previewTemplate, setDefault, sampleQr };
