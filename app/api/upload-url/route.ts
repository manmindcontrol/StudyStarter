import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/utils";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import puppeteer from "puppeteer";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60 seconds for heavy pages

const supabase = createServiceRoleClient();

// Helper function to fetch URL content with better headers
async function fetchUrlContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      "DNT": "1",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Cache-Control": "max-age=0",
    },
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(
        "Access denied by the website. This site may block automated access. Try copying and pasting the content manually instead."
      );
    } else if (response.status === 404) {
      throw new Error("Page not found. Please check the URL and try again.");
    } else if (response.status >= 500) {
      throw new Error(
        "The website is currently unavailable. Please try again later."
      );
    }
    throw new Error(`Failed to fetch URL: ${response.statusText}`);
  }

  const html = await response.text();
  return html;
}

// Clean extracted text from unwanted content
function cleanExtractedText(text: string): string {
  // Remove script-like content (JavaScript code)
  let cleaned = text.replace(/document\.(querySelector|getElementById|addEventListener)[^;]*;/g, '');
  cleaned = cleaned.replace(/@font-face\{[^}]*\}/g, '');
  cleaned = cleaned.replace(/@media[^{]*\{[^}]*\}/g, '');
  cleaned = cleaned.replace(/\.[\w-]+\{[^}]*\}/g, ''); // Remove CSS classes
  cleaned = cleaned.replace(/window\.(addEventListener|onload)[^;]*;/g, '');
  cleaned = cleaned.replace(/\[].slice\.call[^;]*;/g, '');
  cleaned = cleaned.replace(/transform:\s*matrix\([^)]*\)[^;]*;/g, '');
  cleaned = cleaned.replace(/-webkit-[^:]*:[^;]*;/g, '');
  cleaned = cleaned.replace(/font-family:\s*ff\d+[^;]*;/g, '');

  // Remove URLs from font declarations
  cleaned = cleaned.replace(/src:url\(https?:\/\/[^)]*\)[^;]*;/g, '');

  // Remove common ad-related patterns
  cleaned = cleaned.replace(/lite-ad-[a-z0-9-]*/gi, '');
  cleaned = cleaned.replace(/adUnitEvent/g, '');
  cleaned = cleaned.replace(/gptEvent/g, '');

  // Remove excessive whitespace and newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
  cleaned = cleaned.replace(/\s{3,}/g, ' '); // Max 2 consecutive spaces
  cleaned = cleaned.trim();

  return cleaned;
}

// Extract readable content from HTML using JSDOM + Readability
function extractContentFromHTML(html: string, url: string): string | null {
  try {
    const dom = new JSDOM(html, { url });

    // Remove script and style tags before parsing
    const scripts = dom.window.document.querySelectorAll('script, style, noscript');
    scripts.forEach(el => el.remove());

    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article && article.textContent && article.textContent.trim().length > 100) {
      const cleaned = cleanExtractedText(article.textContent.trim());
      if (cleaned.length > 100) {
        return cleaned;
      }
    }

    // Fallback: try to get text from body
    const bodyText = dom.window.document.body?.textContent || "";
    const cleaned = cleanExtractedText(bodyText.trim());

    if (cleaned.length > 100) {
      return cleaned;
    }

    return null;
  } catch (error) {
    console.error("Error parsing HTML with JSDOM:", error);
    return null;
  }
}

// Fetch using Puppeteer (headless browser) for JavaScript-heavy pages
async function fetchWithPuppeteer(url: string): Promise<string | null> {
  let browser = null;
  try {
    console.log("[Puppeteer] Launching browser for URL:", url);

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
    });

    const page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate to the page
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait a bit for any lazy-loaded content
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get the page content
    const html = await page.content();

    // Try to extract main content
    const textContent = await page.evaluate(() => {
      // Try to find main content areas
      const mainSelectors = [
        'article',
        'main',
        '[role="main"]',
        '.post-content',
        '.entry-content',
        '.article-content',
        '.content'
      ];

      for (const selector of mainSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent && element.textContent.trim().length > 200) {
          return element.textContent.trim();
        }
      }

      // Fallback to body
      return document.body.textContent?.trim() || '';
    });

    await browser.close();

    if (textContent && textContent.length > 100) {
      const cleaned = cleanExtractedText(textContent);
      if (cleaned.length > 100) {
        console.log("[Puppeteer] Successfully extracted content, length:", cleaned.length);
        return cleaned;
      }
    }

    // If page evaluation didn't work well, try JSDOM on the rendered HTML
    const extracted = extractContentFromHTML(html, url);
    if (extracted) {
      console.log("[Puppeteer] Extracted via JSDOM from rendered HTML, length:", extracted.length);
      return extracted;
    }

    return null;
  } catch (error) {
    console.error("[Puppeteer] Error:", error);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Hybrid extraction: try JSDOM first, fallback to Puppeteer
async function extractContent(url: string): Promise<string> {
  console.log("[Extraction] Starting hybrid extraction for:", url);

  let jsdomError: any = null;
  let jsdomContent: string | null = null;

  // Step 1: Try simple fetch + JSDOM (fast)
  try {
    console.log("[Extraction] Step 1: Trying JSDOM...");
    const html = await fetchUrlContent(url);
    jsdomContent = extractContentFromHTML(html, url);

    if (jsdomContent && jsdomContent.length >= 300) {
      console.log("[Extraction] ✓ JSDOM extraction successful, length:", jsdomContent.length);
      return jsdomContent;
    }

    console.log("[Extraction] JSDOM content too short:", jsdomContent?.length || 0, "chars. Trying Puppeteer...");
  } catch (error) {
    jsdomError = error;
    console.log("[Extraction] JSDOM fetch failed:", error instanceof Error ? error.message : String(error));
    console.log("[Extraction] Falling back to Puppeteer...");
  }

  // Step 2: Fallback to Puppeteer (slower but handles JS)
  console.log("[Extraction] Step 2: Trying Puppeteer...");
  const puppeteerContent = await fetchWithPuppeteer(url);

  if (puppeteerContent && puppeteerContent.length >= 100) {
    console.log("[Extraction] ✓ Puppeteer extraction successful, length:", puppeteerContent.length);
    return puppeteerContent;
  }

  // Build detailed error message
  const errorDetails = [];
  if (jsdomError) {
    errorDetails.push(`JSDOM: ${jsdomError.message}`);
  } else if (jsdomContent !== null) {
    errorDetails.push(`JSDOM: Content too short (${jsdomContent.length} chars)`);
  }
  if (!puppeteerContent) {
    errorDetails.push("Puppeteer: Failed to extract content");
  } else {
    errorDetails.push(`Puppeteer: Content too short (${puppeteerContent.length} chars)`);
  }

  console.error("[Extraction] ✗ All methods failed:", errorDetails.join("; "));

  throw new Error(
    "Could not extract meaningful content from URL. The page might be empty, protected, or require authentication."
  );
}

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized - No authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    const userId = user.id;

    const body = await request.json();
    const { url, title } = body;

    if (!url || !title) {
      return NextResponse.json(
        { error: "Missing url or title" },
        { status: 400 }
      );
    }

    // Validate URL format
    let urlObj: URL;
    try {
      urlObj = new URL(url);
      if (!urlObj.protocol.startsWith("http")) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Fetch and extract content using hybrid approach
    const extractedText = await extractContent(url);

    // Insert to DB
    const { data: material, error: dbError } = await supabase
      .from("materials")
      .insert({
        user_id: userId,
        title: title,
        file_name: urlObj.hostname,
        file_type: "url",
        content: extractedText,
        storage_path: url, // Store the original URL in storage_path
        openai_file_id: null, // URLs don't have OpenAI file IDs
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: `Error saving to database: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      material,
      textLength: extractedText.length,
    });
  } catch (error) {
    console.error("URL upload error:", error);
    const msg =
      error instanceof Error ? error.message : "Unexpected upload error";

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
