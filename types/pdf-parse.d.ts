declare module 'pdf-parse' {
  import { Buffer } from 'buffer';

  export interface PDFParseResult {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    version: string;
    text: string;
  }

  // default export – presne to, čo chceme
  export default function pdfParse(
    data: Buffer | Uint8Array
  ): Promise<PDFParseResult>;
}
