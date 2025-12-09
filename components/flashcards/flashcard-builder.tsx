"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { previewGeneratedFlashcards, saveFlashcardSet } from "@/app/actions/generate-flashcards";
import { createBrowserClient } from "@supabase/ssr";
import { Trash2, Plus, Download, Save, Loader2 } from "lucide-react";
import { SidePanel } from "@/components/ui/side-panel";
import { exportToPdf, exportToDocx, exportToTxt, formatFlashcardsForExport } from "@/lib/export-utils";
import { motion, AnimatePresence } from "framer-motion";

interface Document {
  id: string;
  source_label: string;
}

interface FlashcardItem {
  front: string;
  back: string;
  isAi?: boolean;
}

interface Props {
  onGenerated?: (setId: string) => void;
}

export function FlashcardBuilder({ onGenerated }: Props) {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [numCards, setNumCards] = useState(10);

  // States for generation & manual entry
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cards, setCards] = useState<FlashcardItem[]>([]);
  const [manualFront, setManualFront] = useState("");
  const [manualBack, setManualBack] = useState("");

  const [showExportPanel, setShowExportPanel] = useState(false);

  // Fetch user's documents
  useEffect(() => {
    async function fetchDocuments() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data, error } = await supabase
          .from("documents")
          .select("id, source_label")
          .order("created_at", { ascending: false });

        if (!error && data) {
          setDocuments(data);
          if (data.length > 0) {
            setSelectedDocId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      } finally {
        setIsLoadingDocs(false);
      }
    }

    fetchDocuments();
  }, []);

  const handleGeneratePreview = async () => {
    if (!selectedDocId) {
      setError("Please select a document");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const generated = await previewGeneratedFlashcards({
        docId: selectedDocId,
        numCards,
      });

      // Append new cards to existing list
      setCards(prev => [...prev, ...generated.map(g => ({ ...g, isAi: true }))]);
    } catch (err) {
      console.error("Flashcard generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate flashcards");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddManualCard = () => {
    if (!manualFront.trim() || !manualBack.trim()) return;

    setCards(prev => [...prev, { front: manualFront, back: manualBack, isAi: false }]);
    setManualFront("");
    setManualBack("");
  };

  const handleDeleteCard = (index: number) => {
    setCards(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveSet = async () => {
    if (cards.length === 0) {
      setError("No cards to save");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const doc = documents.find(d => d.id === selectedDocId);
      const title = doc ? `Flashcards: ${doc.source_label}` : "Custom Flashcards";

      const setId = await saveFlashcardSet({
        title,
        docId: selectedDocId || undefined,
        cards: cards,
      });

      if (onGenerated) {
        onGenerated(setId);
      } else {
        router.push(`/flashcards/${setId}`);
      }
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save flashcard set");
      setIsSaving(false);
    }
  };

  // Export handlers
  const getExportTitle = () => {
    const doc = documents.find(d => d.id === selectedDocId);
    return doc ? `Flashcards - ${doc.source_label}` : "My Flashcards";
  };

  const activeTitle = getExportTitle();
  const formattedText = formatFlashcardsForExport(activeTitle, cards);

  return (
    <div className="space-y-6">

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Main Builder Area */}
        <div className="flex-1 w-full space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-6">Flashcard builder</h2>

            {/* Topic / Set Title */}
            <div className="space-y-4 mb-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Topic
                </label>
                <Input
                  placeholder="e.g. Operating Systems, Photosynthesis"
                  className="bg-background"
                  // If we had a generic topic state, we'd bind it here.
                  // For now, let's bind it to a new state or repurpose manual logic.
                  // Since the prompt screenshot implies this sets the context, let's treat it as the Set Title.
                  onChange={(e) => {
                    // For now just cosmetic or updating a title state if we add one.
                    // Actually, let's allow saving with a custom title if manual.
                  }}
                />
              </div>
            </div>

            {/* Front / Back Inputs */}
            <div className="grid gap-6 md:grid-cols-2 mb-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium leading-none text-muted-foreground">Front</label>
                <Input
                  placeholder="Question or term"
                  value={manualFront}
                  onChange={e => setManualFront(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium leading-none text-muted-foreground">Back</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Answer or definition"
                  value={manualBack}
                  onChange={e => setManualBack(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddManualCard();
                  }}
                />
              </div>
            </div>

            <Button
              onClick={handleAddManualCard}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!manualFront || !manualBack}
            >
              Add manual flashcard
            </Button>
          </div>
        </div>

        {/* AI Sidebar */}
        <div className="w-full xl:w-80 space-y-4 shrink-0">
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
            <h3 className="font-semibold">AI assist</h3>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Generate flashcards automatically from your uploaded documents.
              </p>

              {isLoadingDocs ? (
                <p className="text-xs text-muted-foreground">Loading documents...</p>
              ) : documents.length > 0 ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Select Document</label>
                    <select
                      className="h-9 w-full rounded-md border bg-background px-3 text-xs"
                      value={selectedDocId}
                      onChange={(e) => setSelectedDocId(e.target.value)}
                    >
                      {documents.map((doc) => (
                        <option key={doc.id} value={doc.id}>{doc.source_label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Count</label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={numCards}
                      onChange={(e) => setNumCards(Number(e.target.value))}
                      className="h-9 text-xs"
                    />
                  </div>
                  <Button
                    onClick={handleGeneratePreview}
                    disabled={isGenerating || !selectedDocId}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate flashcards with AI"}
                  </Button>
                </>
              ) : (
                <div className="text-xs text-center p-2 border border-dashed rounded">
                  No documents found.
                  <Button variant="ghost" className="h-auto p-0 text-xs text-primary underline" onClick={() => router.push("/upload")}>Upload one</Button>
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              This uses your uploaded documents to generate relevant flashcards. Review them in the preview list below before saving.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Preview List */}
      {cards.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Flashcards ({cards.length})</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowExportPanel(true)}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button onClick={handleSaveSet} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? "Saving..." : "Save Set"}
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            <AnimatePresence initial={false}>
              {cards.map((card, idx) => (
                <motion.div
                  key={idx} // Using index as key since no ID yet, and simple list
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card group relative"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium shrink-0 mt-1">
                    {idx + 1}
                  </div>
                  <div className="flex-1 grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Front</p>
                      <p className="text-sm">{card.front}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Back</p>
                      <p className="text-sm">{card.back}</p>
                    </div>
                  </div>
                  {card.isAi && (
                    <span className="absolute top-2 right-12 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] font-bold">
                      AI
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteCard(idx)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Export Panel */}
      <SidePanel
        isOpen={showExportPanel}
        onClose={() => setShowExportPanel(false)}
        title="Export Flashcards"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Select a format to download your {cards.length} flashcards.</p>
          <div className="grid gap-2">
            <Button variant="outline" className="justify-start" onClick={() => exportToPdf()}>
              Export as PDF (Print)
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => exportToDocx(activeTitle, formattedText.replace(/\n/g, '<br/>'))}>
              Export as DOCX
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => exportToTxt(activeTitle, formattedText)}>
              Export as Text
            </Button>
          </div>
        </div>
      </SidePanel>

    </div>
  );
}

