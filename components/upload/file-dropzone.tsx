"use client";

import { useState, DragEvent, ChangeEvent, useRef } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onMockUpload: (fileName: string) => void;
  onFileSelected?: (file: File) => void;
}

export function FileDropzone({ onMockUpload, onFileSelected }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onMockUpload(file.name);
      if (onFileSelected) {
        onFileSelected(file);
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onMockUpload(file.name);
      if (onFileSelected) {
        onFileSelected(file);
      }
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
        Drag & drop documents here
      </p>
      <p className="text-xs text-muted-foreground">
        
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        size="sm"
        className="mt-2"
        type="button"
        onClick={() => fileInputRef.current?.click()}
      >
        Browse files
      </Button>
    </div>
  );
}
