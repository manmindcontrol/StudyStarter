import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check if file is PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text from PDF
    const pdfData = await pdf(buffer);
    const textContent = pdfData.text;

    // Process text to preserve original structure
    // Keep each line as is to maintain document structure
    const lines = textContent.split('\n');
    const paragraphs: Paragraph[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Calculate indentation from original line
      const leadingSpaces = line.match(/^(\s+)/)?.[1].length || 0;
      const indentLevel = Math.floor(leadingSpaces / 2); // Every 2 spaces = 1 indent level

      // Empty line - preserve spacing
      if (trimmedLine.length === 0) {
        paragraphs.push(new Paragraph({
          text: '',
          spacing: { before: 0, after: 0 }
        }));
        continue;
      }

      // Check for special formatting
      const isBulletPoint = /^[•\-\*○●]\s+/.test(trimmedLine);
      const isNumberedList = /^\d+[\.\)]\s+/.test(trimmedLine);
      const isListItem = isBulletPoint || isNumberedList;

      // Create paragraph preserving structure
      paragraphs.push(new Paragraph({
        children: [new TextRun({
          text: trimmedLine,
          size: 24, // 12pt
        })],
        spacing: {
          before: 0,   // Minimal spacing to preserve structure
          after: 0,    // Let original line breaks do the spacing
          line: 276,   // Single line spacing (276 twips)
        },
        indent: {
          left: isListItem ? 360 : (indentLevel * 360), // 360 twips ≈ 0.25 inch per indent
          hanging: isListItem ? 180 : 0, // Hanging indent for list items
        },
        alignment: AlignmentType.LEFT,
      }));
    }

    // Create a new DOCX document
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs.length > 0 ? paragraphs : [
          new Paragraph({
            children: [new TextRun('No text content found in PDF.')],
          }),
        ],
      }],
    });

    // Generate DOCX buffer
    const docxBuffer = await Packer.toBuffer(doc);

    // Return the DOCX file as Uint8Array
    return new NextResponse(new Uint8Array(docxBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${file.name.replace('.pdf', '.docx')}"`,
      },
    });
  } catch (error) {
    console.error('PDF to DOCX conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert PDF to DOCX. The PDF might be image-based or corrupted.' },
      { status: 500 }
    );
  }
}
