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
    const { data, error } = await supabase.functions.invoke("extract-text", {
      body: { path: storagePath },
    });

    if (error) {
      throw new Error("extract-text Edge Function call failed");
    }

    rawText = (data as { rawText?: string }).rawText ?? "";
  } else if (sourceType === "url") {
    const { data, error } = await supabase.functions.invoke("fetch-url", {
      body: { url },
    });

    if (error) {
      throw new Error("fetch-url Edge Function call failed");
    }

    rawText = (data as { rawText?: string }).rawText ?? "";
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
