// Document → plain-text extractor for the spec-from-doc pipeline.
//
// Handles four formats. Returns plain text suitable for handing to the LLM
// extractor. Extraction is intentionally minimal — we don't preserve layout
// or styling, just the prose. The LLM tolerates small format losses.
//
// .pdf uses `pdf-parse` (text-only PDFs work fine; scanned/image PDFs return
//        empty text — caller should surface that as a clearer error).
// .docx uses `mammoth.extractRawText` (drops styles, keeps paragraph order).
// .md/.txt are read as utf-8 verbatim.

import { Buffer } from 'node:buffer';

export type DocExtension = 'md' | 'txt' | 'pdf' | 'docx';

export const SUPPORTED_DOC_EXTENSIONS: DocExtension[] = ['md', 'txt', 'pdf', 'docx'];

export function extensionFor(filename: string): DocExtension | null {
  const ext = filename.toLowerCase().split('.').pop();
  if (!ext) return null;
  return SUPPORTED_DOC_EXTENSIONS.includes(ext as DocExtension)
    ? (ext as DocExtension)
    : null;
}

export interface ExtractedDoc {
  text: string;
  /** Best-effort character count. Lets the route reject empty/garbled docs. */
  charCount: number;
  /** Pages or paragraphs, depending on the source format. Informational only. */
  segmentCount?: number;
}

export async function extractDocText(buf: Buffer, ext: DocExtension): Promise<ExtractedDoc> {
  switch (ext) {
    case 'md':
    case 'txt': {
      const text = buf.toString('utf8').trim();
      return { text, charCount: text.length };
    }
    case 'pdf': {
      // pdf-parse loads a debug fixture from disk on `import` of the package
      // root in some versions. Importing the file path directly avoids that
      // and keeps cold-start clean. The deep path has no .d.ts shipped, so
      // we cast the dynamic import here.
      // @ts-expect-error — pdf-parse ships no types for this internal path
      const mod = await import('pdf-parse/lib/pdf-parse.js');
      const result = (await (mod.default as (b: Buffer) => Promise<{
        text: string;
        numpages?: number;
      }>)(buf));
      const text = (result.text ?? '').trim();
      return { text, charCount: text.length, segmentCount: result.numpages };
    }
    case 'docx': {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer: buf });
      const text = (result.value ?? '').trim();
      return { text, charCount: text.length };
    }
  }
}
