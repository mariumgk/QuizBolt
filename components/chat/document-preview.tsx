"use client";

interface Props {
  title?: string;
}

export function DocumentPreview({ title }: Props) {
  return (
    <div className="h-full rounded-xl border bg-card p-3 text-xs text-muted-foreground">
      <p className="mb-2 text-sm font-medium text-foreground">
        Document preview
      </p>
      {title ? (
        <>
          <p className="mb-1 truncate text-foreground">{title}</p>
          <p>
            This is a mock preview of the selected document. Connect your real
            storage later to show actual pages or extracted text.
          </p>
        </>
      ) : (
        <p>No document selected yet.</p>
      )}
    </div>
  );
}
