"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onImported: (url: string) => void;
}

export function UrlInput({ onImported }: Props) {
  const [value, setValue] = useState("");

  const handleImport = () => {
    if (!value.trim()) return;
    onImported(value.trim());
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="https://example.com/article-to-study"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button type="button" onClick={handleImport}>
        Import URL
      </Button>
    </div>
  );
}
