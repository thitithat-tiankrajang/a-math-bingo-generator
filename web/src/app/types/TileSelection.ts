export type SelectedTile =
  | { source: 'rack'; index: number }
  | { source: 'answer'; index: number }
  | null;
