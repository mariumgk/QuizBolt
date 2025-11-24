"use client";

import { useState } from "react";
import { FileDropzone } from "@/components/upload/file-dropzone";
import { UrlInput } from "@/components/upload/url-input";
import { PdfPreview } from "@/components/upload/pdf-preview";

export default function UploadPage() {
  const [sourceLabel, setSourceLabel] = useState<string | undefined>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Upload materials</h1>
        <p className="text-sm text-muted-foreground">
          Bring in PDFs, images, or URLs and let QuizBolt turn them into quizzes,
          flashcards, and AI notes.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <FileDropzone onMockUpload={(name) => setSourceLabel(name)} />
          <UrlInput onImported={(url) => setSourceLabel(url)} />
        </div>
        <PdfPreview sourceLabel={sourceLabel} />
      </div>
    </div>
  );
}
