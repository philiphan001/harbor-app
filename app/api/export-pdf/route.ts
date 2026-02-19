import { NextResponse } from "next/server";

/**
 * POST /api/export-pdf
 * Accepts HTML and returns it as a downloadable HTML file.
 *
 * For true PDF generation, this could be extended with puppeteer or
 * a cloud PDF service. For now, we return a self-contained HTML file
 * that can be opened in any browser and printed to PDF.
 *
 * The client-side "Print" button already provides native Save-as-PDF
 * via the browser's print dialog — this route provides a downloadable
 * alternative.
 */
export async function POST(request: Request) {
  try {
    const { html, parentName } = await request.json();

    if (!html) {
      return NextResponse.json({ error: "HTML content is required" }, { status: 400 });
    }

    // Add print-optimized styles to the HTML
    const printOptimizedHtml = html.replace(
      "</style>",
      `
        @media print {
          body { padding: 0; margin: 0; }
          .no-print { display: none; }
        }
        @page { margin: 0.75in; }
      </style>`
    );

    const filename = `${(parentName || "Care_Summary").replace(/\s+/g, "_")}_Care_Summary.html`;

    return new NextResponse(printOptimizedHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export PDF error:", error);
    return NextResponse.json({ error: "Failed to generate export" }, { status: 500 });
  }
}
