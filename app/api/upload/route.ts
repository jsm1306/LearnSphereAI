import type { NextRequest } from "next/server";
import { extractPdfText } from "@/lib/pdf";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  const requestId = crypto.randomUUID();

  if (
    !file ||
    typeof file !== "object" ||
    file === null ||
    typeof (file as any).arrayBuffer !== "function"
  ) {
    return Response.json(
      { success: false, message: "No file was uploaded.", requestId },
      { status: 400 }
    );
  }

  const fileAny = file as any;
  const fileType = fileAny.type ?? "";
  const fileName = fileAny.name ?? "(unknown)";
  const fileSize = typeof fileAny.size === "number" ? fileAny.size : null;

  console.log("[UPLOAD] received", {
    requestId,
    fileName,
    fileType,
    fileSize,
  });

  if (fileType !== "application/pdf") {
    return Response.json(
      {
        success: false,
        message: "Uploaded file must be a PDF.",
        requestId,
        fileType,
      },
      { status: 400 }
    );
  }

  try {
    const arrayBuffer = await fileAny.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("[UPLOAD] buffer ready", {
      requestId,
      bytes: buffer.byteLength,
    });

    const { pageCount, text, pages } = await extractPdfText(buffer);

    return Response.json({
      success: true,
      pageCount,
      text,
      pages,
      requestId,
    });
  } catch (error) {
    console.error("UPLOAD ERROR", {
      requestId,
      error,
    });

    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");

    const isProd = process.env.NODE_ENV === "production";

    return Response.json(
      {
        success: false,
        message,
        ...(isProd ? null : { error: message, stack: (error as any)?.stack }),
        requestId,
      },
      { status: 500 }
    );
  }
}

