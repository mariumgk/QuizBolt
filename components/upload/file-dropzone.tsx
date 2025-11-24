"use client";

import { useState, DragEvent } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onMockUpload: (fileName: string) => void;
}

export function FileDropzone({ onMockUpload }: Props) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onMockUpload(file.name);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/40 px-6 py-10 text-center"
    >
      <UploadCloud className="h-8 w-8 text-primary" />
      <p className="text-sm font-medium">
        Drag & drop PDFs, images, or documents here
      </p>
      <p className="text-xs text-muted-foreground">
        Mock upload only – files stay in your browser.
      </p>
      <Button size="sm" className="mt-2" type="button">
        Browse files
      </Button>
    </div>
  );
}
