import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile } from '../types';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only initialize remote Supabase browser client if valid env vars are explicitly configured
export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

export interface CohortCandidateSummary {
  id: string;
  name: string;
  university: string;
  graduationYear: string;
  streakDays: number;
  streakShieldActive: boolean;
  highGameScore: number;
  solvedDSACount: number;
  solvedAptitudeCount: number;
  xp: number;
  isCurrentUser?: boolean;
  isOnline?: boolean;
  updatedAt?: string;
}

export async function syncCandidateToSupabase(
  profile: UserProfile
): Promise<void> {
  if (!profile.email || !supabase) return;
  const normalizedEmail = profile.email.trim().toLowerCase();

  try {
    await supabase.from('candidates').upsert(
      {
        email: normalizedEmail,
        name: profile.name.trim().slice(0, 100),
        university: (profile.university || 'Engineering Institution')
          .trim()
          .slice(0, 160),
        graduation_year: (profile.graduationYear || '').trim().slice(0, 16),
        streak_days: profile.streakDays || 0,
        streak_shield_active: Boolean(profile.streakShieldActive),
        high_game_score: profile.highGameScore || 0,
        solved_dsa_ids: profile.solvedDSAIds || [],
        solved_aptitude_ids: profile.solvedAptitudeIds || [],
        bookmarked_dsa_ids: profile.bookmarkedDSAIds || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    );
  } catch {
    // Non-blocking
  }
}

export async function loadCandidateFromSupabase(
  email: string
): Promise<Partial<UserProfile> | null> {
  if (!email || !supabase) return null;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error || !data) return null;

    return {
      name: data.name,
      email: data.email,
      university: data.university || 'Engineering Institution',
      graduationYear: data.graduation_year || '',
      streakDays: typeof data.streak_days === 'number' ? data.streak_days : 0,
      streakShieldActive: Boolean(data.streak_shield_active),
      highGameScore:
        typeof data.high_game_score === 'number' ? data.high_game_score : 0,
      solvedDSAIds: Array.isArray(data.solved_dsa_ids)
        ? data.solved_dsa_ids
        : [],
      solvedAptitudeIds: Array.isArray(data.solved_aptitude_ids)
        ? data.solved_aptitude_ids
        : [],
      bookmarkedDSAIds: Array.isArray(data.bookmarked_dsa_ids)
        ? data.bookmarked_dsa_ids
        : [],
    };
  } catch {
    return null;
  }
}

export async function fetchCohortLeaderboardFromSupabase(
  currentEmail?: string
): Promise<CohortCandidateSummary[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select(
        'id, email, name, university, graduation_year, streak_days, streak_shield_active, high_game_score, solved_dsa_ids, solved_aptitude_ids, updated_at'
      )
      .limit(50);

    if (error || !Array.isArray(data)) return [];
    const normalizedCurrent = (currentEmail || '').trim().toLowerCase();

    return data
      .map((row: any, idx: number) => {
        const dsaCount = Array.isArray(row.solved_dsa_ids)
          ? row.solved_dsa_ids.length
          : 0;
        const aptCount = Array.isArray(row.solved_aptitude_ids)
          ? row.solved_aptitude_ids.length
          : 0;
        const streak = typeof row.streak_days === 'number' ? row.streak_days : 0;
        const gameScore =
          typeof row.high_game_score === 'number' ? row.high_game_score : 0;
        const xp =
          dsaCount * 25 +
          aptCount * 10 +
          streak * 50 +
          Math.floor(gameScore / 100);
        const rowEmail = String(row.email || '').trim().toLowerCase();
        const updatedMs = row.updated_at ? new Date(row.updated_at).getTime() : 0;
        const isOnline =
          rowEmail === normalizedCurrent ||
          (updatedMs > 0 && Date.now() - updatedMs < 15 * 60 * 1000);

        return {
          id: String(row.id || `cand_${idx}`),
          name: String(row.name || 'Candidate'),
          university: String(row.university || 'Engineering Institution'),
          graduationYear: String(row.graduation_year || ''),
          streakDays: streak,
          streakShieldActive: Boolean(row.streak_shield_active),
          highGameScore: gameScore,
          solvedDSACount: dsaCount,
          solvedAptitudeCount: aptCount,
          xp,
          isCurrentUser: Boolean(normalizedCurrent && rowEmail === normalizedCurrent),
          isOnline,
          updatedAt: row.updated_at || '',
        };
      })
      .sort((a, b) => b.xp - a.xp);
  } catch {
    return [];
  }
}
