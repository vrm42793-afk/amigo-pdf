export interface PageText {
  pageNumber: number;
  text: string;
}

export interface DocumentChunkInput {
  content: string;
  chunk_index: number;
  page_number: number;
  section_title: string | null;
  token_count: number;
}

/**
 * Token-aware chunking engine.
 * Target: 1000 - 1500 tokens (approx. 4000 - 6000 characters)
 * Overlap: 150 - 200 tokens (approx. 600 - 800 characters)
 */
export function chunkDocument(pages: PageText[]): DocumentChunkInput[] {
  const chunks: DocumentChunkInput[] = [];
  const TARGET_MIN_CHARS = 4000;
  const OVERLAP_CHARS = 800;

  let currentChunkText = "";
  let currentStartPage = pages[0]?.pageNumber || 1;
  let currentSectionTitle: string | null = null;
  let chunkIndex = 0;

  // Track paragraphs across pages
  const paragraphs: { text: string; pageNumber: number; heading: string | null }[] = [];

  for (const page of pages) {
    // Basic clean up: standardize line endings
    const cleanedText = page.text.replace(/\r\n/g, "\n");
    const rawParagraphs = cleanedText.split(/\n\n+/);

    let activeHeading = null;

    for (const rawPara of rawParagraphs) {
      const paraText = rawPara.trim();
      if (!paraText) continue;

      // Simple heading detection heuristic:
      // Line is short (less than 100 chars), doesn't end with a period, and starts with capital letter, number, or standard heading marker
      const isHeading =
        paraText.length < 100 &&
        !paraText.endsWith(".") &&
        /^[A-Z0-9\s#\-:]{3,}/.test(paraText);

      if (isHeading) {
        activeHeading = paraText;
      }

      paragraphs.push({
        text: paraText,
        pageNumber: page.pageNumber,
        heading: activeHeading
      });
    }
  }

  // Iterate over paragraphs to construct chunks
  let i = 0;
  while (i < paragraphs.length) {
    const para = paragraphs[i];
    
    if (currentChunkText === "") {
      currentStartPage = para.pageNumber;
      currentSectionTitle = para.heading;
    }

    currentChunkText += (currentChunkText === "" ? "" : "\n\n") + para.text;
    
    // Check if we reached the chunk size limit or we are at the end
    const approximateTokens = Math.ceil(currentChunkText.length / 4);

    if (currentChunkText.length >= TARGET_MIN_CHARS || i === paragraphs.length - 1) {
      // If we are over the max limit, we can split, but try to keep it within target limits
      chunks.push({
        content: currentChunkText,
        chunk_index: chunkIndex++,
        page_number: currentStartPage,
        section_title: currentSectionTitle,
        token_count: approximateTokens
      });

      // Clear chunk and calculate overlap
      currentChunkText = "";
      
      if (i < paragraphs.length - 1) {
        // Determine where the overlap starts: look backwards from current index i
        let overlapChars = 0;
        let overlapStartIndex = i;
        
        while (overlapStartIndex >= 0 && overlapChars < OVERLAP_CHARS) {
          overlapChars += paragraphs[overlapStartIndex].text.length + 2;
          overlapStartIndex--;
        }
        
        // Set our index to the start of the overlap so the next iteration starts from there
        // Make sure we advance if the overlap doesn't make progress (e.g. single huge paragraph)
        const nextIndex = Math.max(overlapStartIndex + 1, i - 1);
        if (nextIndex > -1 && nextIndex < i) {
          i = nextIndex;
        }
      }
    }

    i++;
  }

  // Handle remaining text
  if (currentChunkText.trim() !== "") {
    chunks.push({
      content: currentChunkText,
      chunk_index: chunkIndex++,
      page_number: currentStartPage,
      section_title: currentSectionTitle,
      token_count: Math.ceil(currentChunkText.length / 4)
    });
  }

  return chunks;
}
