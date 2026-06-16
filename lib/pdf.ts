import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Vercel/serverless-safe: do NOT point the worker to a local node_modules path.
// pdfjs-dist can fail if we hardcode filesystem URLs to the worker.
// We keep extraction entirely in-memory from the provided Buffer.
// If the worker is unavailable, pdfjs will fall back (or run in a degraded mode).

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

    // Load PDF document (in-memory). Do not rely on filesystem.
    const pdf = await pdfjsLib
      .getDocument({ data: uint8Array })
      .promise;

    
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
