export interface BaseBlock {
  days: Date[];
  effectiveDays: number;
  score: number;
}

export interface SuggestionBlock extends BaseBlock {
  id: string;
  ptoDays: number;
}
