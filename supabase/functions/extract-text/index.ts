// Supabase Edge Function: extract-text
// Extracts text from PDF files stored in Supabase Storage
// @ts-nocheck - This is a Deno file, ignore Node.js TypeScript errors

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { path } = await req.json();

    if (!path) {
      return new Response(
        JSON.stringify({ error: "path is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the PDF file from storage
    const bucket = "documents";
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from(bucket)
      .download(path);

    if (downloadError || !fileData) {
      console.error("Storage download error:", downloadError);
      return new Response(
        JSON.stringify({ error: "Failed to download file from storage", details: downloadError?.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Convert Blob to ArrayBuffer
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Enhanced PDF text extraction
    let rawText = "";

    // Convert to string for parsing
    const pdfString = new TextDecoder("latin1").decode(bytes);

    // Method 1: Extract text from stream objects with FlateDecode
    // Look for text between BT (begin text) and ET (end text) markers
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let streamMatch;

    while ((streamMatch = streamRegex.exec(pdfString)) !== null) {
      const streamContent = streamMatch[1];

      // Try to extract readable text from stream
      // Look for text operators: Tj, TJ, ', "
      const textPatterns = [
        /\(((?:[^()\\]|\\.)*)\)\s*Tj/g,  // (text) Tj
        /\[((?:[^\[\]]*\([^()]*\)[^\[\]]*)*)\]\s*TJ/g,  // [(text)] TJ arrays
      ];

      for (const pattern of textPatterns) {
        let textMatch;
        while ((textMatch = pattern.exec(streamContent)) !== null) {
          let text = textMatch[1];
          // Decode PDF escape sequences
          text = text
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\');
          rawText += text + " ";
        }
      }
    }

    // Method 2: Look for text in content streams (uncompressed)
    if (!rawText.trim()) {
      const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
      let btMatch;

      while ((btMatch = btEtRegex.exec(pdfString)) !== null) {
        const textBlock = btMatch[1];

        // Extract from Tj operators
        const tjRegex = /\(([^)]*)\)\s*Tj/g;
        let tjMatch;
        while ((tjMatch = tjRegex.exec(textBlock)) !== null) {
          rawText += tjMatch[1] + " ";
        }

        // Extract from TJ arrays (array of strings and positioning)
        const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
        let tjArrayMatch;
        while ((tjArrayMatch = tjArrayRegex.exec(textBlock)) !== null) {
          const arrayContent = tjArrayMatch[1];
          const stringRegex = /\(([^)]*)\)/g;
          let stringMatch;
          while ((stringMatch = stringRegex.exec(arrayContent)) !== null) {
            rawText += stringMatch[1];
          }
          rawText += " ";
        }
      }
    }

    // Method 3: Extract any readable ASCII text as fallback
    if (!rawText.trim()) {
      // Look for sequences of printable ASCII characters
      const lines: string[] = [];
      let currentLine = "";

      for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i];
        // Printable ASCII range (32-126) plus newline (10) and carriage return (13)
        if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13) {
          currentLine += String.fromCharCode(byte);
        } else if (currentLine.length > 0) {
          // Filter out lines that look like PDF syntax
          const trimmed = currentLine.trim();
          if (trimmed.length > 3 &&
            !trimmed.match(/^[0-9\s\.]+$/) && // Not just numbers
            !trimmed.match(/^\/[A-Z]/) && // Not PDF operators
            !trimmed.match(/^(obj|endobj|stream|endstream|xref|trailer)$/i) &&
            !trimmed.match(/<<|>>|\[|\]/) &&
            !trimmed.includes('/Type') &&
            !trimmed.includes('/Font') &&
            !trimmed.includes('/Page')) {
            lines.push(trimmed);
          }
          currentLine = "";
        }
      }

      // Add last line if exists
      if (currentLine.trim().length > 3) {
        lines.push(currentLine.trim());
      }

      rawText = lines.join('\n');
    }

    // Clean up the extracted text
    rawText = rawText
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/[^\x20-\x7E\n\r\t]/g, '') // Remove non-printable chars
      .trim();

    // Log extraction info
    console.log(`PDF extraction: extracted ${rawText.length} characters from ${path}`);

    if (!rawText) {
      console.warn("No text extracted from PDF. The PDF might be scanned/image-based or use an unsupported encoding.");
    }

    return new Response(
      JSON.stringify({ rawText }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("extract-text error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
