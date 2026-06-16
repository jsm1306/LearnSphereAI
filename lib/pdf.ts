import PDFParser from "pdf2json";

export interface ExtractedPdf {
  pageCount: number;
  text: string;
}

export async function extractPdfText(
  buffer: Buffer
): Promise<ExtractedPdf> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();

    parser.on("pdfParser_dataError", (err) => {
      reject(err);
    });

    parser.on("pdfParser_dataReady", (pdfData) => {
      try {
        const pages = pdfData.Pages || [];

        const text = pages
          .map((page: any) =>
            (page.Texts || [])
              .flatMap((t: any) =>
                (t.R || []).map((r: any) =>
                  decodeURIComponent(r.T || "")
                )
              )
              .join(" ")
          )
          .join("\n\n");

        resolve({
          pageCount: pages.length,
          text,
        });
      } catch (err) {
        reject(err);
      }
    });

    parser.parseBuffer(buffer);
  });
}