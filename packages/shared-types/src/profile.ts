/**
 * ユーザープロファイル
 * Supabase Auth の auth.users と連携
 */
export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * プロファイル作成用
 */
export interface CreateProfile {
  id: string;
  email: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

/**
 * プロファイル更新用
 */
export interface UpdateProfile {
  display_name?: string | null;
  avatar_url?: string | null;
}
