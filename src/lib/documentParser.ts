import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
// @ts-ignore - Vite specific import
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up PDF.js worker using Vite's URL import for local reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function parsePDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}

export async function parseDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export async function extractText(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'pdf') {
    return parsePDF(file);
  } else if (extension === 'docx') {
    return parseDOCX(file);
  } else if (extension === 'txt') {
    return file.text();
  } else {
    throw new Error('Unsupported file format. Please upload PDF, DOCX, or TXT.');
  }
}
