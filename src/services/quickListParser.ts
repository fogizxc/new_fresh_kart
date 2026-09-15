import type { ApiProduct } from './api';

export interface ParsedListItem {
  rawLine: string;
  query: string;
  requestedQty: number;
  unit: string;
  matchedProduct?: ApiProduct;
  matchScore: number;
  isSelected: boolean;
}

/**
 * Parses raw grocery text into structured items and fuzzy matches with products.
 */
export function parseGroceryList(rawText: string, catalog: ApiProduct[]): ParsedListItem[] {
  const lines = rawText
    .split(/[\n,;•]+/)
    .map(l => l.trim())
    .filter(l => l.length > 1);

  return lines.map(line => {
    let clean = line.toLowerCase();

    // Detect quantity patterns like "1kg", "500g", "2 packets", "dozen", "6 pcs", "2L"
    let requestedQty = 1;
    let unit = 'unit';

    const qtyMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(kg|g|gm|gms|kilo|kilos|l|liter|litres|litre|packets?|pkts?|pcs?|pieces?|box|boxes|dozen)?\b/i);

    if (qtyMatch) {
      requestedQty = parseFloat(qtyMatch[1]) || 1;
      unit = qtyMatch[2]?.toLowerCase() || 'unit';
      clean = clean.replace(qtyMatch[0], '').trim();
    } else if (clean.includes('dozen')) {
      requestedQty = 12;
      unit = 'pcs';
      clean = clean.replace('dozen', '').trim();
    } else if (clean.includes('half kg') || clean.includes('1/2 kg')) {
      requestedQty = 0.5;
      unit = 'kg';
      clean = clean.replace(/half kg|1\/2 kg/, '').trim();
    }

    // Clean stop words: "of", "and", "fresh", "packet of"
    const normalizedQuery = clean
      .replace(/\b(of|and|fresh|good|packet|pkt|box|pack)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Match against catalog
    let bestMatch: ApiProduct | undefined = undefined;
    let highestScore = 0;

    const queryWords = normalizedQuery.split(' ').filter(w => w.length > 1);

    for (const prod of catalog) {
      const prodName = prod.name.toLowerCase();
      const prodCat = prod.category.toLowerCase();
      let score = 0;

      if (prodName.includes(normalizedQuery) && normalizedQuery.length > 2) {
        score = 80;
      }

      for (const word of queryWords) {
        if (prodName.includes(word)) score += 25;
        if (prodCat.includes(word)) score += 10;
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = prod;
      }
    }

    return {
      rawLine: line,
      query: normalizedQuery || line,
      requestedQty: Math.max(1, Math.round(requestedQty)),
      unit,
      matchedProduct: highestScore >= 20 ? bestMatch : undefined,
      matchScore: highestScore,
      isSelected: highestScore >= 20
    };
  });
}
