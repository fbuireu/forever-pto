export interface Block {
  days: Date[];
  effectiveDays: number;
  score: number;
}

export interface SuggestionBlock extends Block {
  id: string;
  ptoDays: number;
}

