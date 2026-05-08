"use server";

import { cleanText } from "@/lib/rag/clean";
import { createServerSupabaseClient } from "@/supabase/server";

export type IngestSourceType = "upload" | "url" | "text";

export type IngestResult = {
  docId: string;
  storagePath?: string;
  rawText?: string;
  cleanedText?: string;
};

export async function ingestDocument(params: {
  sourceType: IngestSourceType;
  storagePath?: string;
  url?: string;
  text?: string;
  sourceLabel?: string; // Optional custom label (e.g., PDF filename)
}): Promise<IngestResult> {
  const { sourceType, storagePath, url, text, sourceLabel: customLabel } = params;

  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error("Failed to get authenticated user");
  }

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  if (sourceType === "upload" && !storagePath) {
    throw new Error("storagePath is required for upload ingestion");
  }

  if (sourceType === "url" && !url) {
    throw new Error("url is required for url ingestion");
  }

  if (sourceType === "text" && !text) {
    throw new Error("text is required for text ingestion");
  }

  // Use custom label if provided, otherwise use default based on source type
  let sourceLabel = customLabel || "Document";

  if (!customLabel) {
    if (sourceType === "upload") {
      sourceLabel = "Uploaded PDF";
    } else if (sourceType === "url") {
      sourceLabel = url ?? "URL";
    } else if (sourceType === "text") {
      sourceLabel = "Pasted text";
    }
  }

  // Create a row in the documents table to get a real UUID doc_id
  const { data: docRow, error: docError } = await supabase
    .from("documents")
    .insert({
      user_id: userId,
      source_label: sourceLabel,
      source_type: sourceType,
    })
    .select("id")
    .single();

  if (docError || !docRow) {
    throw new Error("Failed to create document record");
  }

  const docId: string = docRow.id;

  let rawText = "";

  if (sourceType === "upload") {
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(storagePath!);

    if (downloadError || !fileData) {
      throw new Error("Failed to download file from storage for extraction");
    }

    try {
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfParseLib = await import("pdf-parse");
      const pdfParse = (pdfParseLib.default || pdfParseLib) as any;
      const parsedPdf = await pdfParse(buffer);
      rawText = parsedPdf.text ?? "";
    } catch (err) {
      console.error("PDF parse error:", err);
      throw new Error("extract-text internal parsing failed");
    }
  } else if (sourceType === "url") {
    try {
      const response = await fetch(url!, {
        headers: {
          "User-Agent": "QuizBolt/1.0 (Educational Content Fetcher)",
        },
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      }

      let html = await response.text();

      // Extract clean text from HTML
      html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
      html = html.replace(/<!--[\s\S]*?-->/g, '');
      html = html.replace(/<[^>]+>/g, ' ');

      html = html
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'");

      html = html
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, ' ')
        .replace(/ +/g, ' ')
        .replace(/\n\n+/g, '\n\n')
        .trim();

      const lines = html.split('\n').filter(line => line.trim().length > 0);
      rawText = lines.join('\n');
    } catch (err) {
      console.error("fetch-url error:", err);
      throw new Error("fetch-url network or parsing failed");
    }
  } else if (sourceType === "text") {
    rawText = text ?? "";
  }

  const cleanedText = cleanText(rawText);

  return {
    docId,
    storagePath,
    rawText,
    cleanedText,
  };
}
