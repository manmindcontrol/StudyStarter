import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { createServiceRoleClient } from '@/lib/utils';
import { getUserTierAndLimits } from '@/lib/usage';
import { stripe } from '@/lib/stripe';

const supabase = createServiceRoleClient();

// Prevent a paid Stripe session from being used more than once
const usedStripeSessions = new Set<string>();

// Account-based rate limiting for Basic users
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const BASIC_RATE_LIMIT = 20; // 20 conversions per hour for Basic
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(key: string, limit: number): { allowed: boolean; remainingTime?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true };
  }

  if (record.count >= limit) {
    const remainingTime = Math.ceil((record.resetTime - now) / 1000 / 60); // minutes
    return { allowed: false, remainingTime };
  }

  record.count++;
  return { allowed: true };
}

export async function POST(request: NextRequest) {
  try {
    // Check auth and determine tier
    const authHeader = request.headers.get('authorization');
    const stripeSessionId = request.headers.get('x-stripe-session-id');

    let tierId = 'free';
    let userId: string | null = null;

    if (authHeader) {
      // Logged-in user path
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
      try {
        const tierInfo = await getUserTierAndLimits(user.id);
        tierId = tierInfo.tierId;
      } catch {
        // Fallback to free tier
      }
    } else if (stripeSessionId) {
      // Guest paid via Stripe — verify the session
      if (usedStripeSessions.has(stripeSessionId)) {
        return NextResponse.json({ error: 'This payment session has already been used.' }, { status: 403 });
      }
      let session;
      try {
        session = await stripe.checkout.sessions.retrieve(stripeSessionId);
      } catch {
        return NextResponse.json({ error: 'Invalid payment session.' }, { status: 401 });
      }
      if (session.payment_status !== 'paid' || session.metadata?.type !== 'pdf_conversion') {
        return NextResponse.json({ error: 'Payment not completed.' }, { status: 402 });
      }
      usedStripeSessions.add(stripeSessionId);
      tierId = 'paid_guest';
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting based on tier
    // Free / No account: No hourly rate limit (payment per use is the gate)
    // Basic: 20/hour per account
    // Premium: Unlimited
    if (tierId === 'basic' && userId) {
      const rateCheck = checkRateLimit(`user:${userId}`, BASIC_RATE_LIMIT);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          {
            error: `Rate limit exceeded. Basic plan allows ${BASIC_RATE_LIMIT} conversions per hour. Please try again in ${rateCheck.remainingTime} minutes or upgrade to Premium for unlimited conversions.`
          },
          { status: 429 }
        );
      }
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file properties
    if (!file.name || typeof file.name !== 'string') {
      return NextResponse.json(
        { error: 'Invalid file: missing or invalid file name' },
        { status: 400 }
      );
    }

    // Check if file is PDF - check both MIME type and file extension
    const isPdfMimeType = file.type === 'application/pdf';
    const isPdfExtension = file.name.toLowerCase().endsWith('.pdf');

    if (!isPdfMimeType && !isPdfExtension) {
      return NextResponse.json(
        { error: `File must be a PDF. Received type: ${file.type}, name: ${file.name}` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text from PDF
    let pdfData;
    let textContent;

    try {
      pdfData = await pdf(buffer);
      textContent = pdfData.text;
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      throw new Error(`Failed to parse PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
    }

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
