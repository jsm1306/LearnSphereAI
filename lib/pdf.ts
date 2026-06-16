import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { join } from "path";
import { pathToFileURL } from "url";

// Set up worker for Node.js environment using local file
if (typeof pdfjsLib.GlobalWorkerOptions !== "undefined") {
  const workerPath = join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
}


export interface ExtractedPdf {
  pageCount: number;
  text: string;
}

/**
 * Extract text from all pages of a PDF buffer
 * @param buffer - PDF file as Buffer
 * @returns Object containing page count and extracted text
 */
export async function extractPdfText(buffer: Buffer): Promise<ExtractedPdf> {
  try {
    const uint8Array = new Uint8Array(buffer);
    
    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    
    const pageCount = pdf.numPages;
    const textContent: string[] = [];

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textLayer = await page.getTextContent();
      
      const pageText = textLayer.items
        .map((item: any) => (item.str ? item.str : ""))
        .join("");
      
      textContent.push(pageText);
    }

    // Combine all page text
    const combinedText = textContent.join("\n\n");

    return {
      pageCount,
      text: combinedText,
    };
  } catch (error) {
    throw new Error(
      `Failed to extract PDF text: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
