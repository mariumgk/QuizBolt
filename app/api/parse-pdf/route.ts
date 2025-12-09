import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Check if it's a PDF
        if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
            return NextResponse.json(
                { error: "File must be a PDF" },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Dynamically import pdf-parse to avoid any SSR issues
        const pdfParse = (await import("pdf-parse")).default;

        // Parse the PDF
        const data = await pdfParse(buffer);

        // Return the extracted text
        return NextResponse.json({
            text: data.text,
            numPages: data.numpages,
            info: data.info,
        });
    } catch (error: any) {
        console.error("PDF parse error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to parse PDF" },
            { status: 500 }
        );
    }
}
