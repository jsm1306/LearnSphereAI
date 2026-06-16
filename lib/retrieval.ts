export interface Page {
  pageNumber: number;
  text: string;
}

/**
 * Extracts stop words and calculates relevance score based on:
 * 1. Keyword matches
 * 2. Phrase matches (bigrams, trigrams, exact query substring)
 * 3. Text overlap (Jaccard similarity)
 *
 * Returns the top 3 relevant pages.
 */
export function retrieveRelevantPages(question: string, pages: Page[]): Page[] {
  if (!pages || pages.length === 0) return [];

  const query = question.toLowerCase().trim();

  // Clean punctuation helper
  const cleanText = (t: string) => 
    t.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, " ")
     .replace(/\s+/g, " ")
     .trim();

  const cleanedQuery = cleanText(query);
  const queryWords = cleanedQuery.split(" ").filter((w) => w.length > 1);

  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "of", "in", "on", 
    "at", "to", "for", "with", "by", "about", "against", "between", "into", "through", 
    "during", "before", "after", "above", "below", "from", "up", "down", "out", "this", 
    "that", "these", "those", "it", "he", "she", "they", "we", "you", "i", "me", "my", 
    "your", "them", "us", "what", "which", "who", "whom", "how", "why", "where", "when", 
    "can", "will", "would", "should", "could", "has", "have", "had", "do", "does", "did"
  ]);

  const keywords = queryWords.filter((w) => !stopWords.has(w));
  const searchTerms = keywords.length > 0 ? keywords : queryWords;

  const scoredPages = pages.map((page) => {
    const pageText = page.text.toLowerCase();
    const cleanedPageText = cleanText(pageText);
    const pageWords = cleanedPageText.split(" ").filter((w) => w.length > 0);
    const pageWordSet = new Set(pageWords);

    let score = 0;

    // 1. Keyword matches
    searchTerms.forEach((term) => {
      if (pageWordSet.has(term)) {
        score += 2.0; // Base keyword match
        
        // Term frequency bonus (up to +1.0)
        const regex = new RegExp(`\\b${term}\\b`, "g");
        const matches = pageText.match(regex);
        const count = matches ? matches.length : 0;
        score += Math.min(5, count) * 0.2;
      }
    });

    // 2. Phrase matching (Bigrams & Trigrams)
    if (searchTerms.length >= 2) {
      for (let i = 0; i < searchTerms.length - 1; i++) {
        const bigram = `${searchTerms[i]} ${searchTerms[i + 1]}`;
        if (pageText.includes(bigram)) {
          score += 3.0; // Bigram match bonus
        }
      }
    }

    if (searchTerms.length >= 3) {
      for (let i = 0; i < searchTerms.length - 2; i++) {
        const trigram = `${searchTerms[i]} ${searchTerms[i + 1]} ${searchTerms[i + 2]}`;
        if (pageText.includes(trigram)) {
          score += 5.0; // Trigram match bonus
        }
      }
    }

    // Exact query substring match bonus for larger queries
    if (cleanedQuery.length > 8 && pageText.includes(cleanedQuery)) {
      score += 8.0;
    }

    // 3. Jaccard similarity (text overlap)
    const intersection = new Set([...searchTerms].filter((x) => pageWordSet.has(x)));
    const union = new Set([...searchTerms, ...pageWordSet]);
    const jaccard = union.size > 0 ? intersection.size / union.size : 0;
    score += jaccard * 12.0; // Scaled Jaccard overlap

    return { page, score };
  });

  // Sort descending by relevance score
  scoredPages.sort((a, b) => b.score - a.score);

  // Return top 3 pages that have a non-zero relevance score.
  // If all pages scored 0, fallback to returning the first 3 pages.
  const relevantScored = scoredPages.filter((x) => x.score > 0);
  const finalPages = relevantScored.length > 0 
    ? relevantScored.map((x) => x.page)
    : pages.slice(0, 3);

  return finalPages.slice(0, 3);
}
