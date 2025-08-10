export interface Block {
  days: Date[];
  effectiveDays: number;
  score: number;
}

export interface SuggestionBlock extends Block {
  id: string;
  ptoDays: number;
}

export interface AlternativeBlock extends SuggestionBlock {
  alternativeFor: string;
  metadata: AlternativeBlockMetadata;
}

interface AlternativeBlockMetadata {
  similarityScore: number;
  effectiveDiff: number;
  sizeDiff: number;
  temporalDistance: number;
  reason: string;
}
