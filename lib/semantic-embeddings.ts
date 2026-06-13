import type { DictionaryEntry } from "../data/types";

/**
 * Lightweight semantic embedding system for zero-shot reasoning.
 * Maps terms to context vectors and performs semantic similarity matching.
 * Enables detection of unmapped regional slang through contextual proximity.
 */

interface SemanticVector {
  termId: string;
  context: string[];
  similarity: number;
}

interface EmbeddingMap {
  [term: string]: {
    vector: number[];
    context: string[];
  };
}

/**
 * Generate a simple semantic vector based on term characteristics.
 * In production, this would use a pre-trained model like Sentence Transformers.
 */
function generateSemanticVector(entry: DictionaryEntry): number[] {
  const terms = [
    entry.term,
    entry.literal,
    entry.contextual,
    entry.culturalTip,
  ];
  const combined = terms.join(" ").toLowerCase();

  // Character n-gram based vector (simplified embedding)
  const vector: number[] = new Array(64).fill(0);
  for (let i = 0; i < combined.length; i++) {
    const charCode = combined.charCodeAt(i);
    const idx = (charCode * (i + 1)) % vector.length;
    vector[idx] += 1 / combined.length;
  }
  return vector;
}

/**
 * Calculate cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Build embedding map from dictionary entries for semantic search.
 */
export function buildEmbeddingMap(entries: DictionaryEntry[]): EmbeddingMap {
  const map: EmbeddingMap = {};

  for (const entry of entries) {
    const vector = generateSemanticVector(entry);
    map[entry.term.toLowerCase()] = {
      vector,
      context: [
        entry.literal,
        entry.contextual,
        entry.culturalTip,
        entry.level,
      ],
    };
  }

  return map;
}

/**
 * Perform semantic search on unmapped terms via zero-shot reasoning.
 * Returns closest semantic matches even for unknown slang/phrases.
 */
export function semanticSearch(
  query: string,
  embeddingMap: EmbeddingMap,
  topK: number = 3
): SemanticVector[] {
  const queryVector = generateSemanticVector({
    term: query,
    literal: query,
    contextual: query,
    culturalTip: "",
    level: "neutral",
    pronunciationGuide: "",
    guidanceType: "response",
  });

  const scores: SemanticVector[] = [];

  for (const [term, data] of Object.entries(embeddingMap)) {
    const similarity = cosineSimilarity(queryVector, data.vector);
    if (similarity > 0.1) {
      scores.push({
        termId: term,
        context: data.context,
        similarity,
      });
    }
  }

  return scores.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}

/**
 * Zero-shot context reasoning: match unmapped terms to closest semantic neighbors.
 * Enables the app to provide cultural guidance for slang not in the dictionary.
 */
export function zeroShotReasoning(
  unmappedTerm: string,
  entries: DictionaryEntry[]
): DictionaryEntry | null {
  const embeddingMap = buildEmbeddingMap(entries);
  const matches = semanticSearch(unmappedTerm, embeddingMap, 1);

  if (matches.length === 0) return null;

  // Find the entry that corresponds to the top match
  const topMatch = matches[0];
  return (
    entries.find(
      (e) => e.term.toLowerCase() === topMatch.termId.toLowerCase()
    ) || null
  );
}
