import fs from "fs/promises";

/**
 * Extracts plain text from a supported document so it can be sent to the
 * AI provider as context. Returns undefined for file types with no text
 * representation (plain images) — callers should treat that as "not
 * analyzable as text" rather than an error.
 */
export async function extractText(filePath: string, mimeType: string): Promise<string | undefined> {
  switch (mimeType) {
    case "text/plain":
    case "text/csv":
      return fs.readFile(filePath, "utf-8");

    case "application/pdf": {
      // Lazy-imported so the dependency is only loaded when a PDF actually
      // needs parsing.
      const pdfParse = (await import("pdf-parse")).default;
      const buffer = await fs.readFile(filePath);
      const result = await pdfParse(buffer);
      return result.text;
    }

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      const mammoth = await import("mammoth");
      const buffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    default:
      return undefined;
  }
}

/** Trims extracted text to a sane size before it's sent as AI context. */
export function trimForContext(text: string, maxChars = 12000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n\n[...truncated for length...]";
}
