const fs = require('fs');
const path = require('path');

const getAbsolutePath = (...segments) => {
  return path.resolve(...segments);
};

const readFileAsBase64 = (filePath) => {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
  const buffer = fs.readFileSync(absolutePath);
  const ext = path.extname(filePath).toLowerCase().slice(1);
  const mimeTypes = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
  };
  const mime = mimeTypes[ext] || 'application/octet-stream';
  return `data:${mime};base64,${buffer.toString('base64')}`;
};

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

module.exports = { getAbsolutePath, readFileAsBase64, ensureDirectoryExists };
