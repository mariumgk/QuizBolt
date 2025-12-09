"use client";

interface Props {
  sourceLabel?: string;
}

export function PdfPreview({ sourceLabel }: Props) {
  if (!sourceLabel) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border bg-muted/40 text-xs text-muted-foreground">
        Document preview will appear here after mock upload.
      </div>
    );
  }

  return (
    <div className="h-48 rounded-xl border bg-card p-3 text-xs text-muted-foreground overflow-hidden">
      <p className="mb-2 text-sm font-medium text-foreground truncate">
        {sourceLabel}
      </p>
      <p>
        Render the first pages of the uploaded PDF or extracted content.
      </p>
    </div>
  );
}
