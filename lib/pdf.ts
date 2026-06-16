import PDFParser from "pdf2json";

export type PdfPage = {
  pageNumber: number;
  text: string;
};

export interface ExtractedPdf {
  pageCount: number;
  pages: PdfPage[];
  // Backward-compatible concatenated text (used by summary/quiz/recommendations)
  text: string;
}

function extractPageText(page: any): string {
  return (page?.Texts || [])
    .flatMap((t: any) => (t?.R || []).map((r: any) => decodeURIComponent(r?.T || "")))
    .join(" ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractPdfText(buffer: Buffer): Promise<ExtractedPdf> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();

    parser.on("pdfParser_dataError", (err) => {
      reject(err);
    });

    parser.on("pdfParser_dataReady", (pdfData) => {
      try {
        const pages = (pdfData as any)?.Pages || [];

        const extractedPages: PdfPage[] = pages.map((page: any, idx: number) => {
          const pageNumber = idx + 1;
          const text = extractPageText(page);
          return { pageNumber, text };
        });

        const text = extractedPages
          .map((p) => p.text)
          .filter((t) => t && t.trim().length > 0)
          .join("\n\n");

        resolve({
          pageCount: extractedPages.length,
          pages: extractedPages,
          text,
        });
      } catch (err) {
        reject(err);
      }
    });

    parser.parseBuffer(buffer);
  });
}

