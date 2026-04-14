import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set up PDF.js worker using Vite's robust URL pattern
const PDF_WORKER_URL = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();
console.log('PDF Worker URL:', PDF_WORKER_URL);
pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

export async function parsePDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      // Disable worker for now if it's causing issues, or at least handle the failure
      // useWorkerFetch: false 
    });
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
  } catch (error: any) {
    console.error('PDF Parsing Error:', error);
    throw new Error(`Failed to parse PDF: ${error.message || 'Unknown error'}`);
  }
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
