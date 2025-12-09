// Supabase Edge Function: fetch-url
// Fetches and extracts clean text from web URLs
// @ts-nocheck - This is a Deno file, ignore Node.js TypeScript errors

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "url is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return new Response(
        JSON.stringify({ error: "Only HTTP and HTTPS URLs are supported" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch the HTML content from the URL
    const response = await fetch(url, {
      headers: {
        "User-Agent": "QuizBolt/1.0 (Educational Content Fetcher)",
      },
      // Set timeout
      signal: AbortSignal.timeout(30000), // 30 seconds
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: `Failed to fetch URL: ${response.status} ${response.statusText}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get HTML content
    const html = await response.text();

    // Extract clean text from HTML
    let rawText = html;

    // Remove script tags and their content
    rawText = rawText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove style tags and their content
    rawText = rawText.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove HTML comments
    rawText = rawText.replace(/<!--[\s\S]*?-->/g, '');

    // Remove all HTML tags
    rawText = rawText.replace(/<[^>]+>/g, ' ');

    // Decode HTML entities
    rawText = rawText
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");

    // Normalize whitespace
    rawText = rawText
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')     // Replace tabs with spaces
      .replace(/ +/g, ' ')     // Collapse multiple spaces
      .replace(/\n\n+/g, '\n\n') // Collapse multiple newlines to max 2
      .trim();

    // Remove lines that are just whitespace
    const lines = rawText.split('\n').filter(line => line.trim().length > 0);
    rawText = lines.join('\n');

    return new Response(
      JSON.stringify({ rawText }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("fetch-url error:", error);

    // Handle timeout errors
    if ((error as any).name === "AbortError" || (error as any).name === "TimeoutError") {
      return new Response(
        JSON.stringify({ error: "Request timeout - URL took too long to respond" }),
        {
          status: 504,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
