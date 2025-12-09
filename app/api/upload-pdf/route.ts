import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json(
        { error: "Failed to get authenticated user" },
        { status: 500 },
      );
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing or invalid file field" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const bucket = "documents";

    // Sanitize the original filename to avoid characters that are invalid in
    // Supabase Storage keys (e.g. smart quotes, spaces, etc.).
    const originalName = file.name || "document.pdf";
    const safeName = originalName
      // Normalize to remove exotic unicode characters
      .normalize("NFKD")
      // Replace anything that isn't a word char, dot, or dash with a hyphen
      .replace(/[^\w.-]+/g, "-")
      // Prevent names that are just dots or empty
      .replace(/^\.+$/, "file.pdf");

    const path = `documents/${userId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type || "application/pdf",
      });

    if (uploadError) {
      console.error("upload-pdf error", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 },
      );
    }

    return NextResponse.json({ storagePath: path, fileName: safeName });
  } catch (error) {
    console.error("upload-pdf route error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
