"use client";

import { useState, useEffect, useCallback } from "react";
import { FileDropzone } from "@/components/upload/file-dropzone";
import { PdfPreview } from "@/components/upload/pdf-preview";
import { ingestDocument } from "@/app/actions/ingest";
import { embedChunksAction } from "@/app/actions/embed";
import { storeChunks } from "@/app/actions/store-chunks";
import { chunkText } from "@/lib/rag/chunk";

type SourceType = "upload" | "text" | "url";

// Declare PDF.js as global
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export default function UploadPage() {
  const [sourceLabel, setSourceLabel] = useState<string | undefined>();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [url, setUrl] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastDocId, setLastDocId] = useState<string | null>(null);
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false);

  // Load PDF.js from CDN via script tag
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.pdfjsLib) {
      setPdfJsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        setPdfJsLoaded(true);
      }
    };
    script.onerror = () => {
      console.error("Failed to load PDF.js from CDN");
    };
    document.head.appendChild(script);

    return () => {
      // Don't remove on cleanup - we want it to persist
    };
  }, []);

  const extractPdfText = useCallback(async (file: File): Promise<string> => {
    if (!pdfJsLoaded || !window.pdfjsLib) {
      throw new Error("PDF reader is loading. Please try again in a moment.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const textParts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => (item.str || ""))
        .join(" ");
      textParts.push(pageText);
    }

    const result = textParts.join("\n\n").trim();
    if (!result) {
      throw new Error("No text could be extracted. The PDF may be scanned/image-based.");
    }
    return result;
  }, [pdfJsLoaded]);

  async function handleProcessDocument() {
    setIsProcessing(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    setLastDocId(null);

    try {
      let cleanedText = "";
      let docId = "";

      if (sourceType === "upload") {
        if (!pdfFile) {
          throw new Error("Please select a PDF file first.");
        }

        setSourceLabel(pdfFile.name);

        // Extract text from PDF
        const extractedText = await extractPdfText(pdfFile);

        // Ingest using the extracted text, but with PDF filename as label
        const ingestResult = await ingestDocument({
          sourceType: "text",
          text: extractedText,
          sourceLabel: pdfFile.name, // Use PDF filename for display in chat list
        });

        // Upload to storage for reference (optional)
        const formData = new FormData();
        formData.append("file", pdfFile);
        await fetch("/api/upload-pdf", {
          method: "POST",
          body: formData,
        }).catch(() => { });

        cleanedText = ingestResult.cleanedText ?? "";
        docId = ingestResult.docId;
      } else if (sourceType === "text") {
        if (!pastedText.trim()) {
          throw new Error("Please paste some text to process.");
        }

        setSourceLabel("Pasted text");

        const ingestResult = await ingestDocument({
          sourceType: "text",
          text: pastedText,
        });

        cleanedText = ingestResult.cleanedText ?? "";
        docId = ingestResult.docId;
      } else if (sourceType === "url") {
        if (!url.trim()) {
          throw new Error("Please enter a URL to process.");
        }

        setSourceLabel(url);

        const ingestResult = await ingestDocument({
          sourceType: "url",
          url,
        });

        cleanedText = ingestResult.cleanedText ?? "";
        docId = ingestResult.docId;
      }

      if (!cleanedText) {
        throw new Error("No text available after ingestion.");
      }

      const chunks = chunkText(cleanedText);
      const embedded = await embedChunksAction(chunks.map((c) => c.text));

      const storedCount = await storeChunks({
        docId,
        chunks,
        embeddings: embedded.map((e) => e.embedding),
      });

      setSuccessMessage(`Processed and stored ${storedCount} chunks.`);
      setLastDocId(docId);
    } catch (error: any) {
      setErrorMessage(error?.message ?? "Failed to process document.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Upload materials</h1>
        <p className="text-sm text-muted-foreground">
          Bring in PDFs or paste raw text and let QuizBolt turn them into quizzes,
          flashcards, and AI notes.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                className={`px-3 py-1 rounded border ${sourceType === "upload" ? "bg-primary text-primary-foreground" : "bg-background"}`}
                onClick={() => setSourceType("upload")}
              >
                Upload PDF {!pdfJsLoaded && "(Loading...)"}
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded border ${sourceType === "text" ? "bg-primary text-primary-foreground" : "bg-background"}`}
                onClick={() => setSourceType("text")}
              >
                Paste text
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded border ${sourceType === "url" ? "bg-primary text-primary-foreground" : "bg-background"}`}
                onClick={() => setSourceType("url")}
              >
                From URL
              </button>
            </div>
          </div>

          {sourceType === "upload" ? (
            <FileDropzone
              onMockUpload={(fileName) => {
                setSourceLabel(fileName);
              }}
              onFileSelected={(file: File) => {
                setPdfFile(file);
                setSourceLabel(file.name);
              }}
            />
          ) : sourceType === "text" ? (
            <textarea
              className="w-full min-h-[180px] rounded border bg-background p-3 text-sm"
              placeholder="Paste your study materials or notes here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
            />
          ) : (
            <input
              type="url"
              className="w-full rounded border bg-background px-3 py-2 text-sm"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          )}

          <button
            type="button"
            onClick={handleProcessDocument}
            disabled={isProcessing || (sourceType === "upload" && !pdfJsLoaded)}
            className="inline-flex items-center rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {isProcessing ? "Processing..." : "Process document"}
          </button>

          {errorMessage && (
            <p className="text-sm text-red-500">{errorMessage}</p>
          )}
          {successMessage && (
            <p className="text-sm text-emerald-500">{successMessage}</p>
          )}
        </div>
        <PdfPreview sourceLabel={sourceLabel} />
      </div>
    </div>
  );
}
