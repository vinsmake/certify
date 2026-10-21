// Descarga y apertura de archivos binarios (PDF) que requieren el JWT.

const PDF_TYPE = 'application/pdf';

export const downloadBlob = (data: BlobPart, filename: string, type = PDF_TYPE) => {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const openBlob = (data: BlobPart, type = PDF_TYPE) => {
  const url = URL.createObjectURL(new Blob([data], { type }));
  window.open(url, '_blank', 'noopener');
  // Dar tiempo a la nueva pestaña de cargar el archivo antes de liberarlo
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

/** URL publica de un archivo del storage (logos y firmas). El path ya viene como /storage/... */
export const storageUrl = (path: string | null | undefined) => path ?? undefined;
