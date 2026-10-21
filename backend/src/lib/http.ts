import type { Response } from 'express';

export const sendPdf = (res: Response, pdf: Buffer, filename: string, disposition: 'inline' | 'attachment') => {
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `${disposition}; filename="${filename}"`,
  });
  res.send(pdf);
};
