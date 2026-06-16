import type { NextRequest } from "next/server";
import { extractPdfText } from "@/lib/pdf";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (
    !file ||
    typeof file !== "object" ||
    file === null ||
    typeof (file as any).arrayBuffer !== "function"
  ) {
    return Response.json(
      { success: false, message: "No file was uploaded." },
      { status: 400 }
    );
  }

  const fileType = (file as any).type ?? "";

  if (fileType !== "application/pdf") {
    return Response.json(
      { success: false, message: "Uploaded file must be a PDF." },
      { status: 400 }
    );
  }

  const arrayBuffer = await (file as any).arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const { pageCount, text } = await extractPdfText(buffer);

    return Response.json({
      success: true,
      pageCount,
      text,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");

    return Response.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

