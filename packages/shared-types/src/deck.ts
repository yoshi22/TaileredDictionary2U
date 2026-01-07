/**
 * Deck（単語帳）
 */
export interface Deck {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  entry_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Deck作成用
 */
export interface CreateDeck {
  name: string;
  description?: string | null;
}

/**
 * Deck更新用
 */
export interface UpdateDeck {
  name?: string;
  description?: string | null;
}

/**
 * Deckリスト取得用（entry_countを含む）
 */
export interface DeckWithStats extends Deck {
  due_count?: number;
}
