"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextareaHTMLAttributes } from "react";

export default function NotesPage() {
  const [summary, setSummary] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setSummary(
        "This is a mock AI-generated summary of your study materials. It will highlight key concepts, definitions, and relationships so you can revise faster.",
      );
      setLoading(false);
    }, 900);
  };

  const handleExport = () => {
    console.log("Mock export", { summary, notes });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">AI notes</h1>
          <p className="text-sm text-muted-foreground">
            Generate structured notes and refine them before exporting.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating…" : "Generate AI summary"}
          </Button>
          <Button onClick={handleExport}>Export notes</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-3 text-sm">
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            AI summary
          </p>
          {summary ? (
            <p>{summary}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Click "Generate AI summary" to create a structured overview of your
              material.
            </p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-3 text-sm">
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            Notes editor
          </p>
          <textarea
            className="min-h-[200px] w-full resize-y rounded-md border bg-background p-2 text-sm outline-none"
            placeholder="Refine the AI summary, add extra details, and organize your own notes here."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
